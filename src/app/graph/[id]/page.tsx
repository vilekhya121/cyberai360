/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { DatePicker, DatePickerProps } from "antd";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GenericChart from "@/app/components/graphs/GenericChart";
import ActiveTransactionsMock from "@/app/components/graphs/ActiveTransactionsMock";
import LocksScatterMock from "@/app/components/graphs/LocksScatterMock";
import ResourceUtilizationMock from "@/app/components/widgets/ResourceUtilizationMock";
import ConnectionsChart from "@/app/components/graphs/ConnectionsChart";

const StackedBar = dynamic(() => import("@/app/components/graphs/StackedBar"), {
  ssr: false,
});

const SynchroChart = dynamic(
  () => import("@/app/components/graphs/SynchronizedAreaChartComponent"),
  {
    ssr: false,
  }
);
type QueryBreakdownRow = {
  timestamp: string;
  insert_count: number;
  select_count: number;
  update_count: number;
  delete_count: number;
};
type SlowQueryRow = { timestamp: string; slow_query_count: number };
type QueryCountRow = { timestamp: string; total_queries: number };

type MetricRecord = {
  name: string;
  unit: "%" | "";
  current_value: number;
  /** “vs Yesterday” %
   *  (we only use for color + display) */
  ["status(%)"]: number;
  /** chart series (timestamp/value) */
  data: Array<{ time: string; value: number }>;
};
type MetricTrendPoint = { timestamp: string; value: number };
type MetricPayload = { trend: MetricTrendPoint[]; average: string };
type AllMetricsResponse = {
  cpu_usage: MetricPayload;
  memory_usage: MetricPayload;
  disk_usage: MetricPayload;
  network_usage: MetricPayload;
  active_connection: MetricPayload;
};
type Perf24Metric = {
  trend: MetricTrendPoint[];
  today_avg: string;
  yesterday_avg: string;
  difference_from_yesterday: string; // e.g. "-2.76"
};
type Perf24Response = {
  cpu_usage: Perf24Metric;
  disk_usage: Perf24Metric;
  memory_usage: Perf24Metric;
  network_usage: Perf24Metric;
};
type ConnectionsPoint = {
  timestamp: string;
  network_usage: number;
  active_connection: number;
  abort_connection: number;
};
type ConnectionsTrafficResponse = { graph_data: ConnectionsPoint[] };
type ActiveTxnRow = { timestamp: string; active_transaction: number };

// Lock scatter payload isn’t shown, so keep it generic and robust.
// We’ll try to infer x/y from common field names.
type RawLockRow = Record<string, any>;

type ScatterPoint = {
  x: number;
  y: number;
  size?: number;
  label?: string; // e.g., "HH:00"
};
// ⬇️ place near other imports
const { RangePicker } = DatePicker;

// ⬇️ seasonal forecast constants (ALLOWED BOUNDS — user can pick any range within)
const SEASONAL_BASE = "https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details";
const SEASONAL_MIN = dayjs("2025-09-11", "YYYY-MM-DD"); // lower bound
const SEASONAL_MAX = dayjs("2026-09-11", "YYYY-MM-DD"); // upper bound

/** disable dates OUTSIDE the allowed window */
function disableOutsideSeasonBounds(d: any) {
  if (!d) return true;
  return d.isBefore(SEASONAL_MIN, "day") || d.isAfter(SEASONAL_MAX, "day");
}

// ⬇️ types for seasonal API
type SeasonalRow = { timestamp: string } & Record<string, number>;
type SeasonalResp = {
  cpu_usage: Array<{ timestamp: string; cpu_usage: number }>;
  memory_usage: Array<{ timestamp: string; memory_usage: number }>;
  disk_usage: Array<{ timestamp: string; disk_usage: number }>;
  network_usage: Array<{ timestamp: string; network_usage: number }>;
};
async function fetchJSONWithRetry<T>(
  url: string,
  options: { signal?: AbortSignal } = {},
  retryCfg = { retries: 2, timeoutMs: 12_000, backoffMs: 1500 }
): Promise<T> {
  const { retries, timeoutMs, backoffMs } = retryCfg;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        signal: options.signal ?? ctrl.signal,
        headers: { accept: "application/json", ...(options as any).headers },
        cache: "no-store",
      });
      clearTimeout(timer);

      if (!res.ok) {
        // Surface status text; 504 is common on tunnels
        const msg = `HTTP ${res.status} ${res.statusText || ""}`.trim();
        throw new Error(msg);
      }
      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timer);
      const isLast = attempt === retries;

      // AbortError or network error or 5xx → retry (except last)
      const transient =
        err?.name === "AbortError" ||
        /HTTP 5\d\d/.test(err?.message || "") ||
        /Failed to fetch|NetworkError/i.test(err?.message || "");

      if (!transient || isLast) {
        throw err;
      }
      // backoff
      await new Promise((r) => setTimeout(r, backoffMs * (attempt + 1)));
    }
  }
  // Should not get here
  throw new Error("Unexpected fetch retry fallthrough");
}

// ⬇️ map seasonal API → MetricRecord bits (daily labels)
function shapeSeasonalSeries(rows: SeasonalRow[], valueKey: string) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { data: [], current_value: 0 };
  }
  const data = rows.map((p) => ({
    time: dayjs(p.timestamp).format("DD MMM"),
    value: Number.isFinite((p as any)[valueKey])
      ? Number((p as any)[valueKey])
      : 0,
  }));
  const current_value = data[data.length - 1]?.value ?? 0;
  return { data, current_value };
}

const toHH = (ts: string) => dayjs(ts).format("HH:00");
// Sum duplicates per hour label
function aggregateByHour<T extends Record<string, any>>(
  rows: T[],
  tsKey: keyof T,
  sums: Array<[keyof T, string]> // [columnKey, outputKey] (outputKey unused here, for clarity)
) {
  const map = new Map<string, Record<string, number>>();
  rows.forEach((r) => {
    const label = toHH(String(r[tsKey]));
    if (!map.has(label)) map.set(label, {});
    const bucket = map.get(label)!;
    for (const [k] of sums) {
      const v = Number(r[k] ?? 0);
      bucket[String(k)] = (bucket[String(k)] ?? 0) + (isFinite(v) ? v : 0);
    }
  });
  // sort by HH
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, agg]) => ({ label, ...agg }));
}

function toStackedBarData(qb: QueryBreakdownRow[]) {
  // select→com_select, insert→combiners, update→com_update, delete→com_delete, others=0
  const sums = [
    ["select_count", "com_select"],
    ["insert_count", "combiners"],
    ["update_count", "com_update"],
    ["delete_count", "com_delete"],
  ] as Array<[keyof QueryBreakdownRow, string]>;

  const hourly = aggregateByHour(qb, "timestamp", sums);
  return hourly.map((h) => ({
    time: h.label,
    com_select: (h as any).select_count ?? 0,
    combiners: (h as any).insert_count ?? 0,
    com_update: (h as any).update_count ?? 0,
    com_delete: (h as any).delete_count ?? 0,
    others: 0,
  }));
}

function toAreaSeries<T extends { timestamp: string }>(
  rows: T[],
  valueKey: keyof T
): { label: string; value: number }[] {
  const summed = aggregateByHour(rows, "timestamp", [
    [valueKey, "value"] as any,
  ]);
  return summed.map((r) => ({
    label: r.label,
    value: Number((r as any)[valueKey] ?? 0),
  }));
}

function disabledFutureDates(current: any) {
  return current && current > dayjs().endOf("day");
}
function makeSeries(
  seedHour = 0,
  base = 60,
  swing = 35
): Array<{ time: string; value: number }> {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  return hours.map((h, i) => {
    const t = (h + seedHour) % 24;
    const amp =
      i % 4 === 0
        ? swing
        : i % 4 === 1
        ? swing * 0.6
        : i % 4 === 2
        ? swing * 0.9
        : swing * 0.4;
    const val = Math.max(
      0,
      Math.min(100, Math.round(base + (i % 2 === 0 ? amp : -amp)))
    );
    const hh = t.toString().padStart(2, "0");
    return { time: `${hh}:00`, value: val };
  });
}
function toCardSeries(trend: MetricTrendPoint[]) {
  return trend.map((p) => ({ time: toHH(p.timestamp), value: p.value }));
}

// ---- Forecast Trends: types & shapers (module scope) ----
type ForecastPoint = { timestamp: string; value: number };
function shapeForecastTrend(rows: ForecastPoint[]) {
  const data = (rows ?? []).map((p) => ({
    time: dayjs(p.timestamp).format("HH:00"),
    value: Number(p.value ?? 0),
  }));
  const current_value = data.at(-1)?.value ?? 0;
  return { data, current_value };
}

/** ---- PERF TREND (MOCK) ---- */
type TrendPoint = {
  t: string; // x-axis label
  ac: number; // Active connection
  cpu: number; // CPU Utilization
  thr: number; // ThroughPut
  dio: number; // Data I/O
  mem: number; // Memory
};

/* 9:00 → 12:30 sequence matching your layout */
const PERF_TREND_BASE: TrendPoint[] = [
  { t: "9:00", ac: 55, cpu: 62, thr: 60, dio: 25, mem: 15 },
  { t: "9:30", ac: 66, cpu: 68, thr: 62, dio: 22, mem: 8 },
  { t: "10:00", ac: 82, cpu: 74, thr: 64, dio: 35, mem: 18 },
  { t: "10:30", ac: 80, cpu: 70, thr: 66, dio: 30, mem: 32 },
  { t: "11:00", ac: 86, cpu: 78, thr: 70, dio: 24, mem: 28 },
  { t: "11:30", ac: 91, cpu: 75, thr: 72, dio: 20, mem: 22 },
  { t: "12:00", ac: 70, cpu: 66, thr: 68, dio: 10, mem: 10 },
  { t: "12:30", ac: 68, cpu: 64, thr: 65, dio: 6, mem: 6 },
];

/** Build the 4 tiles (CPU, Memory, Disk, Network) from API; fallback handled later */
function buildPerfCardsFromApi(p: Perf24Response): MetricRecord[] {
  return [
    {
      name: "CPU Usage",
      unit: "%", // keep % for CPU
      current_value: p.cpu_usage.trend.at(-1)?.value ?? 0,
      ["status(%)"]: parseFloat(p.cpu_usage.difference_from_yesterday), // signed!
      data: toCardSeries(p.cpu_usage.trend),
    },
    {
      name: "Memory Usage",
      unit: "%", // keep %
      current_value: p.memory_usage.trend.at(-1)?.value ?? 0,
      ["status(%)"]: parseFloat(p.memory_usage.difference_from_yesterday),
      data: toCardSeries(p.memory_usage.trend),
    },
    {
      name: "Disk Usage",
      unit: "%", // keep %
      current_value: p.disk_usage.trend.at(-1)?.value ?? 0,
      ["status(%)"]: parseFloat(p.disk_usage.difference_from_yesterday),
      data: toCardSeries(p.disk_usage.trend),
    },
    {
      name: "Network Usage",
      unit: "%", // if you prefer no % for network, change to "".
      current_value: p.network_usage.trend.at(-1)?.value ?? 0,
      ["status(%)"]: parseFloat(p.network_usage.difference_from_yesterday),
      data: toCardSeries(p.network_usage.trend),
    },
  ];
}

function buildMockMetrics(dateISO: string): MetricRecord[] {
  const d = dayjs(dateISO);
  const seed = d.date() + d.month() * 31; // deterministic seed per date

  const cpuSeries = makeSeries((seed + 1) % 24, 72, 25);
  const memSeries = makeSeries((seed + 3) % 24, 45, 20);
  const diskSeries = makeSeries((seed + 5) % 24, 22, 18);
  const netSeries = makeSeries((seed + 7) % 24, 55, 28);

  return [
    {
      name: "CPU Usage",
      unit: "%",
      current_value: cpuSeries[cpuSeries.length - 1].value,
      ["status(%)"]: 9, // positive = green, <=10 = red (your original rule)
      data: cpuSeries,
    },
    {
      name: "Memory Usage",
      unit: "%",
      current_value: memSeries[memSeries.length - 1].value,
      ["status(%)"]: 20,
      data: memSeries,
    },
    {
      name: "Disk Usage",
      unit: "%",
      current_value: diskSeries[diskSeries.length - 1].value,
      ["status(%)"]: 13,
      data: diskSeries,
    },
    {
      name: "Network Usage",
      unit: "",
      current_value: 57,
      ["status(%)"]: 28,
      data: netSeries,
    },
  ];
}

function Page() {
  const router = useRouter();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedRange, setSelectedRange] = useState<string | null>("");
  const [apiData, setApiData] = useState<AllMetricsResponse | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [perf24, setPerf24] = useState<Perf24Response | null>(null);
  const [perf24Loading, setPerf24Loading] = useState(false);
  const [perf24Error, setPerf24Error] = useState<string | null>(null);
  // Application Performance: API states
  const [qbRows, setQbRows] = useState<QueryBreakdownRow[] | null>(null);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbError, setQbError] = useState<string | null>(null);

  const [sqRows, setSqRows] = useState<SlowQueryRow[] | null>(null);
  const [sqLoading, setSqLoading] = useState(false);
  const [sqError, setSqError] = useState<string | null>(null);

  const [qcRows, setQcRows] = useState<QueryCountRow[] | null>(null);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcError, setQcError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const dbName = searchParams.get("db") || "DB_01";
  const [connRows, setConnRows] = useState<ConnectionsPoint[] | null>(null);
  const [connLoading, setConnLoading] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  // --- Locking & Transaction: API states ---
  const [activeTxnRows, setActiveTxnRows] = useState<ActiveTxnRow[] | null>(
    null
  );
  const [activeTxnLoading, setActiveTxnLoading] = useState(false);
  const [activeTxnError, setActiveTxnError] = useState<string | null>(null);
  const [seasonalRefetch, setSeasonalRefetch] = useState(0);
  const onSeasonalRetry = () => setSeasonalRefetch((n) => n + 1);

  // Seasonal Forecast gating & status
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [seasonalError, setSeasonalError] = useState<string | null>(null);
  const [seasonalRange, setSeasonalRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [seasonalReady, setSeasonalReady] = useState(false);

  const onSeasonalChange = (vals: any) => {
    if (!vals || vals.length !== 2) {
      setSeasonalRange(null);
      setSeasonalReady(false);
      return;
    }
    const [s, e] = vals;

    // must be inside bounds and ordered (same day OK)
    const inBounds =
      !disableOutsideSeasonBounds(s) && !disableOutsideSeasonBounds(e);
    const ordered = e.isSame(s, "day") || e.isAfter(s, "day");

    if (inBounds && ordered) {
      setSeasonalRange([s.startOf("day"), e.startOf("day")]);
      setSeasonalReady(true);
    } else {
      setSeasonalReady(false);
      setSeasonalRange([s, e] as any); // keep visible but won’t fetch
    }
  };

  const [lockRows, setLockRows] = useState<RawLockRow[] | null>(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  useEffect(() => {
    if (!seasonalReady || !seasonalRange) return;

    let cancelled = false;
    (async () => {
      try {
        setSeasonalLoading(true);
        setSeasonalError(null);

        const startStr = seasonalRange[0].format("YYYY-MM-DD");
        const endStr = seasonalRange[1].format("YYYY-MM-DD");

        const endpoint = `${SEASONAL_BASE}/${encodeURIComponent(
          dbName
        )}/seasonal-forecast?start_date=${startStr}&end_date=${endStr}`;

        const json = await fetchJSONWithRetry<SeasonalResp>(endpoint);

        if (cancelled) return;

        const cpuShaped = shapeSeasonalSeries(
          json.cpu_usage as any,
          "cpu_usage"
        );
        const memShaped = shapeSeasonalSeries(
          json.memory_usage as any,
          "memory_usage"
        );
        const diskShaped = shapeSeasonalSeries(
          json.disk_usage as any,
          "disk_usage"
        );
        const netShaped = shapeSeasonalSeries(
          json.network_usage as any,
          "network_usage"
        );

        setSeasonCpu((s) => ({
          ...s,
          data: cpuShaped.data,
          current_value: cpuShaped.current_value,
        }));
        setSeasonMem((s) => ({
          ...s,
          data: memShaped.data,
          current_value: memShaped.current_value,
        }));
        setSeasonDisk((s) => ({
          ...s,
          data: diskShaped.data,
          current_value: diskShaped.current_value,
        }));
        setSeasonNet((s) => ({
          ...s,
          data: netShaped.data,
          current_value: netShaped.current_value,
        }));
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to load seasonal forecast";
          setSeasonalError(
            /HTTP 504/.test(msg)
              ? "Gateway Timeout (504). The upstream didn’t respond in time."
              : msg
          );
        }
      } finally {
        if (!cancelled) setSeasonalLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // ⬇️ include the refetch counter so clicking Retry runs again
  }, [seasonalReady, seasonalRange, dbName, seasonalRefetch]);

  // Active Transactions
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setActiveTxnLoading(true);
        setActiveTxnError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/locking/active-transactions`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ActiveTxnRow[] = await res.json();
        if (!cancelled) setActiveTxnRows(json ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setActiveTxnError(e?.message || "Failed to load active transactions");
          setActiveTxnRows(null);
        }
      } finally {
        if (!cancelled) setActiveTxnLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  // Locks Scatter
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLockLoading(true);
        setLockError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/locking/lock-scatter`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: RawLockRow[] = await res.json();
        if (!cancelled) setLockRows(Array.isArray(json) ? json : []);
      } catch (e: any) {
        if (!cancelled) {
          setLockError(e?.message || "Failed to load lock scatter");
          setLockRows(null);
        }
      } finally {
        if (!cancelled) setLockLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  // Active Transactions → area/line friendly [{label, value}]
  const activeTxnData = useMemo(() => {
    if (!activeTxnRows?.length) return null;
    const summed = aggregateByHour(activeTxnRows, "timestamp", [
      ["active_transaction", "value"] as any,
    ]);
    return summed.map((r) => ({
      label: r.label, // "HH:00"
      value: Number((r as any).active_transaction ?? 0),
    }));
  }, [activeTxnRows]);

  // Lock Scatter → [{x, y, size?, label}] with best-effort field inference.
  function toNumber(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  const lockScatterData = useMemo<ScatterPoint[] | null>(() => {
    if (!lockRows?.length) return null;

    // Try to detect likely numeric axes per row.
    const candidatesX = [
      "wait_time_ms",
      "duration_ms",
      "hold_time_ms",
      "age_ms",
      "timestamp",
    ];
    const candidatesY = [
      "lock_count",
      "blocked",
      "blocked_count",
      "waiting",
      "lock_waits",
      "contention",
    ];
    const candidatesSize = ["rows", "size", "weight", "impact"];

    return lockRows.map((row) => {
      // pick x
      let x = 0;
      for (const k of candidatesX) {
        if (row[k] != null) {
          x = toNumber(row[k]);
          break;
        }
      }
      // If timestamp is the only thing available, map it to HH as X index
      if (!x && row.timestamp) {
        const hh = Number(dayjs(row.timestamp).format("H"));
        x = Number.isFinite(hh) ? hh : 0;
      }

      // pick y
      let y = 0;
      for (const k of candidatesY) {
        if (row[k] != null) {
          y = toNumber(row[k]);
          break;
        }
      }
      // As a last resort, if we see something like "active_transaction", use it
      if (!y && row.active_transaction != null) {
        y = toNumber(row.active_transaction);
      }

      // pick size
      let size: number | undefined = undefined;
      for (const k of candidatesSize) {
        if (row[k] != null) {
          size = Math.max(2, toNumber(row[k]));
          break;
        }
      }

      const label = row.timestamp
        ? dayjs(row.timestamp).format("HH:00")
        : undefined;

      return { x, y, size, label };
    });
  }, [lockRows]);

  // --- Fetch Connections Traffic (depends on dbName & date like others) ---
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setConnLoading(true);
        setConnError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/connections-traffic`;

        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ConnectionsTrafficResponse = await res.json();
        if (!cancelled) setConnRows(json.graph_data ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setConnError(e?.message || "Failed to load connections traffic");
          setConnRows(null);
        }
      } finally {
        if (!cancelled) setConnLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  // --- Shape data for GenericChart (HH:00 labels) ---
  const connectionsSeries = useMemo(() => {
    if (!connRows?.length) return [];
    return connRows.map((p) => ({
      time: dayjs(p.timestamp).format("HH:00"),
      active: Number(p.active_connection ?? 0),
      aborted: Number(p.abort_connection ?? 0),
      network: Number(p.network_usage ?? 0),
    }));
  }, [connRows]);
  // 1) Query Type Breakdown
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setQbLoading(true);
        setQbError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db/${encodeURIComponent(
          dbName
        )}/query-breakdown`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: QueryBreakdownRow[] = await res.json();
        if (!cancelled) setQbRows(json);
      } catch (e: any) {
        if (!cancelled) {
          setQbError(e?.message || "Failed to load query breakdown");
          setQbRows(null);
        }
      } finally {
        if (!cancelled) setQbLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  // 2) Slow Queries
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setSqLoading(true);
        setSqError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/app-performance/slow-queries`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: SlowQueryRow[] = await res.json();
        if (!cancelled) setSqRows(json);
      } catch (e: any) {
        if (!cancelled) {
          setSqError(e?.message || "Failed to load slow queries");
          setSqRows(null);
        }
      } finally {
        if (!cancelled) setSqLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  // 3) Queries Count
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setQcLoading(true);
        setQcError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/app-performance/query-count`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: QueryCountRow[] = await res.json();
        if (!cancelled) setQcRows(json);
      } catch (e: any) {
        if (!cancelled) {
          setQcError(e?.message || "Failed to load query count");
          setQcRows(null);
        }
      } finally {
        if (!cancelled) setQcLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);
  const breakdownData = useMemo(() => {
    if (qbRows?.length) return toStackedBarData(qbRows);
    return null; // fall back to existing mock in JSX
  }, [qbRows]);

  const slowQueriesData = useMemo(() => {
    if (sqRows?.length) return toAreaSeries(sqRows, "slow_query_count");
    return null; // fall back to mock
  }, [sqRows]);

  const queriesCountData = useMemo(() => {
    if (qcRows?.length) return toAreaSeries(qcRows, "total_queries");
    return null; // fall back to mock
  }, [qcRows]);

  const performances24hr = useMemo<MetricRecord[]>(() => {
    if (perf24) return buildPerfCardsFromApi(perf24);
    return buildMockMetrics(date); // fallback while loading/error
  }, [perf24, date]);

  useEffect(() => {
    let cancelled = false;
    async function fetchPerf24() {
      try {
        setPerf24Loading(true);
        setPerf24Error(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/performance-metrics/24hr`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Perf24Response = await res.json();
        if (!cancelled) setPerf24(json);
      } catch (e: any) {
        if (!cancelled) {
          setPerf24Error(e?.message || "Failed to load 24hr metrics");
          setPerf24(null);
          console.warn("performance-metrics/24hr error:", e);
        }
      } finally {
        if (!cancelled) setPerf24Loading(false);
      }
    }
    fetchPerf24();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAllMetrics() {
      try {
        setApiLoading(true);
        setApiError(null);

        // Use db from query string. Example provided shows `bank_db_1`.
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/all-metrics-trend`;

        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: AllMetricsResponse = await res.json();
        if (!cancelled) setApiData(json);
      } catch (e: any) {
        if (!cancelled) {
          setApiError(e?.message || "Failed to load");
          setApiData(null); // fallback will be used below
          console.warn("all-metrics-trend error:", e);
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    }
    fetchAllMetrics();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);
  const performances: MetricRecord[] = useMemo(
    () => buildMockMetrics(date),
    [date]
  );
  const fixedVal = (val: number, unit: any) =>
    unit != "%" ? `${val}` : `${Math.floor(val)}%`;

  const synchroChartColors = [
    "#FF5B5B",
    "#17B26A",
    "#0BA5EC",
    "#F79009",
    "#6D40D4",
  ];

  /** ---- APPLICATION PERFORMANCE: MOCK DATA ---- */
  const stackedColors = ["#C4CCF5", "#8993D9", "#6672B0", "#303B82", "#B8BEDA"];
  const keys = [
    "com_select",
    "combiners",
    "com_update",
    "com_delete",
    "others",
  ];
  const labels = [
    "Com_select",
    "Combiners",
    "Com_update",
    "Com_delete",
    "Others",
  ];

  type QueryBreakdown = {
    time: string;
    com_select: number;
    combiners: number;
    com_update: number;
    com_delete: number;
    others: number;
  };

  const breakdownMock: QueryBreakdown[] = [
    {
      time: "11:00",
      com_select: 95,
      combiners: 62,
      com_update: 36,
      com_delete: 22,
      others: 10,
    },
    {
      time: "11:30",
      com_select: 78,
      combiners: 55,
      com_update: 30,
      com_delete: 18,
      others: 8,
    },
    {
      time: "12:00",
      com_select: 68,
      combiners: 50,
      com_update: 28,
      com_delete: 16,
      others: 6,
    },
    {
      time: "12:30",
      com_select: 85,
      combiners: 63,
      com_update: 28,
      com_delete: 12,
      others: 8,
    },
  ];

  type XY = { label: string; value: number };
  // ---- Forecast Trends: types ----
  type ForecastSummary = {
    today_avg: string;
    forecast_avg_next_24hrs: string;
    difference_from_today: string; // e.g. "+23.52" or "-3.1"
  };

  // shape hourly trend -> chart series + last value

  function parseSignedNumber(s: string | undefined | null) {
    if (!s) return 0;
    const n = parseFloat(String(s).replace(/[^\d.-]/g, "")); // keep sign/decimal
    return Number.isFinite(n) ? n : 0;
  }

  /* Matches the shape in your screenshot */
  const slowQueriesMock: XY[] = [
    { label: "9:00", value: 50 },
    { label: "9:30", value: 150 },
    { label: "10:00", value: 90 },
    { label: "10:30", value: 210 },
    { label: "11:00", value: 350 },
    { label: "11:30", value: 320 },
    { label: "12:00", value: 420 },
    { label: "12:30", value: 220 },
  ];

  const queriesCountMock: XY[] = [
    { label: "9:00", value: 260 },
    { label: "9:30", value: 150 },
    { label: "10:00", value: 240 },
    { label: "10:30", value: 480 },
    { label: "11:00", value: 420 },
    { label: "11:30", value: 180 },
    { label: "12:00", value: 260 },
    { label: "12:30", value: 120 },
  ];
  

  /** Which series to include based on the left checkboxes */
  const buildTrendMock = useCallback((checked: string[]) => {
    const wantAC = checked.includes("active_connections");
    const wantCPU = checked.includes("cpu_utilization");
    const wantTHR = checked.includes("throughput");
    const wantDIO = checked.includes("data_io");
    const wantMEM = checked.includes("memory_utilization");

    return PERF_TREND_BASE.map((p) => ({
      label: p.t,
      ...(wantAC ? { active_connections: p.ac } : {}),
      ...(wantCPU ? { cpu_utilization: p.cpu } : {}),
      ...(wantTHR ? { throughput: p.thr } : {}),
      ...(wantDIO ? { data_io: p.dio } : {}),
      ...(wantMEM ? { memory_utilization: p.mem } : {}),
    }));
  }, []);

  /** Displayed averages (exactly like the screenshot text) */
  const legendAverages = useMemo(() => {
    if (!apiData) {
      // fallback to your previous mock numbers
      return {
        active_connections: 82,
        cpu_utilization: 75,
        throughput: 65,
        data_io: 37,
        memory_utilization: 22,
      };
    }
    const toInt = (s: string) => Math.round(parseFloat(s));
    return {
      active_connections: toInt(apiData.active_connection.average),
      cpu_utilization: toInt(apiData.cpu_usage.average),
      throughput: toInt(apiData.network_usage.average), // map network → throughput
      data_io: toInt(apiData.disk_usage.average), // map disk → data I/O
      memory_utilization: toInt(apiData.memory_usage.average),
    };
  }, [apiData]);

  const buildTrendFromApi = useCallback((checked: string[]) => {
    if (!apiData) return [] as Record<string, number | string>[];

    const ts = apiData.cpu_usage.trend.map((p) => p.timestamp); // assume aligned
    return ts.map((timestamp, i) => {
      const row: Record<string, number | string> = { label: toHH(timestamp) };

      if (checked.includes("active_connections")) {
        row.active_connections =
          apiData.active_connection.trend[i]?.value ?? undefined;
      }
      if (checked.includes("cpu_utilization")) {
        row.cpu_utilization = apiData.cpu_usage.trend[i]?.value ?? undefined;
      }
      // map ThroughPut → network_usage
      if (checked.includes("throughput")) {
        row.throughput = apiData.network_usage.trend[i]?.value ?? undefined;
      }
      // map Data I/O → disk_usage
      if (checked.includes("data_io")) {
        row.data_io = apiData.disk_usage.trend[i]?.value ?? undefined;
      }
      if (checked.includes("memory_utilization")) {
        row.memory_utilization =
          apiData.memory_usage.trend[i]?.value ?? undefined;
      }
      return row;
    });
  }, [apiData]);

  const PERF_ITEMS = [
    { key: "active_connections", label: "Active connection", colorIndex: 0 },
    { key: "cpu_utilization", label: "CPU Utilization", colorIndex: 1 },
    { key: "throughput", label: "ThroughPut", colorIndex: 2 },
    { key: "data_io", label: "Data I/O", colorIndex: 3 },
    { key: "memory_utilization", label: "Memory", colorIndex: 4 },
  ];

  type PerfLegendProps = {
    checked: string[];
    setChecked: (next: string[]) => void;
    avgs: {
      active_connections: number;
      cpu_utilization: number;
      throughput: number;
      data_io: number;
      memory_utilization: number;
    };
    colors: string[];
  };

  function PerfLegend({ checked, setChecked, avgs, colors }: PerfLegendProps) {
    const allKeys = PERF_ITEMS.map((i) => i.key);
    const allChecked = checked.length === allKeys.length;
    const someChecked = checked.length > 0 && !allChecked;

    const toggleItem = (key: string) => {
      setChecked(
        checked.includes(key)
          ? checked.filter((k) => k !== key)
          : [...checked, key]
      );
    };

    const toggleAll = () => {
      if (allChecked) setChecked([]);
      else setChecked(allKeys);
    };

    return (
      <div className="px-2 py-1 space-y-6">
        {PERF_ITEMS.map((it) => {
          const on = checked.includes(it.key);
          const color = colors[it.colorIndex];
          return (
            <button
              key={it.key}
              onClick={() => toggleItem(it.key)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-3">
                {/* colored square checkbox */}
                <span
                  className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border`}
                  style={{
                    borderColor: color,
                    background: on ? color : "transparent",
                  }}
                >
                  {on ? (
                    <svg viewBox="0 0 20 20" className="h-3 w-3 text-white">
                      <path d="M7.5 13.5L3.5 9.5l1.4-1.4L7.5 10.7l7.6-7.6L16.5 4.5z" />
                    </svg>
                  ) : null}
                </span>

                <div className="leading-tight">
                  <div className="text-sm text-gray-800">{it.label}</div>
                  <div className="text-xs text-gray-500">
                    Avg:{" "}
                    <span className="font-semibold">
                      {avgs[it.key as keyof typeof avgs]}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Compare All */}
        <button onClick={toggleAll} className="flex items-center gap-3 pt-2">
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border border-gray-400`}
            style={{ background: allChecked ? "#111827" : "transparent" }}
          >
            {allChecked ? (
              <svg viewBox="0 0 20 20" className="h-3 w-3 text-white">
                <path d="M7.5 13.5L3.5 9.5l1.4-1.4L7.5 10.7l7.6-7.6L16.5 4.5z" />
              </svg>
            ) : someChecked ? (
              <span className="block h-2 w-2 bg-gray-500" />
            ) : null}
          </span>
          <span className="text-sm text-gray-700">Compare All</span>
        </button>
      </div>
    );
  }

  // Mock-driven trend (no API)
  const [checkedList, setCheckedList] = useState<string[]>([
    "active_connections",
    "data_io",
  ]); // default checked like your image (AC + Data I/O)

  const trendOverTime = useMemo(() => {
    const apiRows = buildTrendFromApi(checkedList);
    // If API is good, prefer it; otherwise fall back to the static mock
    return apiRows.length ? apiRows : buildTrendMock(checkedList);
  }, [buildTrendFromApi, buildTrendMock, checkedList]);

  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    if (typeof dateString === "string") {
      setDate(dayjs(dateString, "DD-MM-YYYY").format("YYYY-MM-DD"));
      setSelectedRange(null);
    }
  };

  const onBack = () => {
    router.back();
  };

  const noop = () => {};
  const fakeStatus = "idle";
  // ⬇️ add with other state
  const [latestMetrics, setLatestMetrics] = useState<{
    cpu_usage: number;
    memory_usage: number;
  } | null>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestError, setLatestError] = useState<string | null>(null);

  // Use latestLoading to avoid unused variable warning
  if (latestLoading) {
    console.log("Loading latest metrics...");
    console.log(latestError);
  }
  // --- Seasonal Forecast (gated by exact fixed range selection)
  const [seasonCpu, setSeasonCpu] = useState<MetricRecord>({
    name: "CPU Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [seasonMem, setSeasonMem] = useState<MetricRecord>({
    name: "Memory Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [seasonDisk, setSeasonDisk] = useState<MetricRecord>({
    name: "Disk Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [seasonNet, setSeasonNet] = useState<MetricRecord>({
    name: "Network Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });


  const seasonalCards: MetricRecord[] = useMemo(
    () => [seasonCpu, seasonMem, seasonDisk, seasonNet],
    [seasonCpu, seasonMem, seasonDisk, seasonNet]
  );



  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLatestLoading(true);
        setLatestError(null);
        const endpoint = `https://nmqhfvs3-8000.inc1.devtunnels.ms/db-details/${encodeURIComponent(
          dbName
        )}/latest-metrics`;
        const res = await fetch(endpoint, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          cpu_usage: number;
          memory_usage: number;
        };
        if (!cancelled) setLatestMetrics(json);
      } catch (e: any) {
        if (!cancelled) {
          setLatestError(e?.message || "Failed to load latest metrics");
          setLatestMetrics(null); // component will fall back to its own mock
        }
      } finally {
        if (!cancelled) setLatestLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [dbName, date]);
  // ---- Forecast Trends state ----
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [forecastRefetch, setForecastRefetch] = useState(0);
  const onForecastRetry = () => setForecastRefetch((n) => n + 1);

  // per-metric tiles (same MetricRecord shape you already use)
  const [fcCpu, setFcCpu] = useState<MetricRecord>({
    name: "CPU Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [fcMem, setFcMem] = useState<MetricRecord>({
    name: "Memory Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [fcDisk, setFcDisk] = useState<MetricRecord>({
    name: "Disk Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });
  const [fcNet, setFcNet] = useState<MetricRecord>({
    name: "Network Usage",
    unit: "%",
    current_value: 0,
    ["status(%)"]: 0,
    data: [],
  });

  const forecastCards: MetricRecord[] = useMemo(
    () => [fcCpu, fcMem, fcDisk, fcNet],
    [fcCpu, fcMem, fcDisk, fcNet]
  );
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setForecastLoading(true);
        setForecastError(null);

        const base = `${SEASONAL_BASE}/${encodeURIComponent(dbName)}/forecast`;

        // endpoints for all metrics
        const trendEndpoints = {
          cpu: `${base}/trend/cpu_usage`,
          mem: `${base}/trend/memory_usage`,
          disk: `${base}/trend/disk_usage`,
          net: `${base}/trend/network_usage`,
        };
        const summaryEndpoints = {
          cpu: `${base}/summary/cpu_usage`,
          mem: `${base}/summary/memory_usage`,
          disk: `${base}/summary/disk_usage`,
          net: `${base}/summary/network_usage`,
        };

        // fetch in parallel (with retry/timeouts)
        const [
          cpuTrend,
          memTrend,
          diskTrend,
          netTrend,
          cpuSum,
          memSum,
          diskSum,
          netSum,
        ] = await Promise.all([
          fetchJSONWithRetry<ForecastPoint[]>(trendEndpoints.cpu),
          fetchJSONWithRetry<ForecastPoint[]>(trendEndpoints.mem),
          fetchJSONWithRetry<ForecastPoint[]>(trendEndpoints.disk),
          fetchJSONWithRetry<ForecastPoint[]>(trendEndpoints.net),
          fetchJSONWithRetry<ForecastSummary>(summaryEndpoints.cpu),
          fetchJSONWithRetry<ForecastSummary>(summaryEndpoints.mem),
          fetchJSONWithRetry<ForecastSummary>(summaryEndpoints.disk),
          fetchJSONWithRetry<ForecastSummary>(summaryEndpoints.net),
        ]);

        if (cancelled) return;

        // shape and set CPU
        const cpuS = shapeForecastTrend(cpuTrend);
        setFcCpu((s) => ({
          ...s,
          data: cpuS.data,
          current_value: cpuS.current_value,
          ["status(%)"]: parseSignedNumber(cpuSum?.difference_from_today),
        }));

        // Memory
        const memS = shapeForecastTrend(memTrend);
        setFcMem((s) => ({
          ...s,
          data: memS.data,
          current_value: memS.current_value,
          ["status(%)"]: parseSignedNumber(memSum?.difference_from_today),
        }));

        // Disk
        const diskS = shapeForecastTrend(diskTrend);
        setFcDisk((s) => ({
          ...s,
          data: diskS.data,
          current_value: diskS.current_value,
          ["status(%)"]: parseSignedNumber(diskSum?.difference_from_today),
        }));

        // Network
        const netS = shapeForecastTrend(netTrend);
        setFcNet((s) => ({
          ...s,
          data: netS.data,
          current_value: netS.current_value,
          ["status(%)"]: parseSignedNumber(netSum?.difference_from_today),
        }));
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.message || "Failed to load forecast trends";
          setForecastError(msg);
        }
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dbName, forecastRefetch]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-w-80 sm:px-6 p-2 lg:px-8 mb-2">
        <div className=" py-1 flex justify-between gap-5  mb-1">
          <div className="flex items-center">
            <Image
              onClick={onBack}
              src="/ops/left.png"
              height={25}
              width={25}
              className="me-3"
              alt="back"
            />
            <h4 className="font-bold text-gray-800 text-xl">
              Analytics_{dbName}
            </h4>
          </div>
          <div className="py-1 flex items-center gap-2 ">
            <DatePicker
              format={"DD-MM-YYYY"}
              defaultValue={dayjs(dayjs(), "YYYY-MM-DD")}
              onChange={onChange}
              disabledDate={disabledFutureDates}
              style={{ width: "auto", height: "auto" }}
              allowClear={false}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className=" lg:col-span-3 col-span-12  ">
            {/* before: <ResourceUtilizationMock /> */}
            <ResourceUtilizationMock
              cpuUsage={latestMetrics?.cpu_usage}
              memoryUsage={latestMetrics?.memory_usage}
            />
          </div>
          <div className="bg-white lg:col-span-4 col-span-12 shadow-sm rounded-xl border-2 border-zinc-200">
            <div className=" px-1  col-span-6">
              <div className=" border-b-2 border-gray-200 p-1 flex flex-col sm:flex-row md:flex-row lg:flex-col xl:flex-row justify-between lg:justify-around items-center mb-4 gap-2 ">
                <h4 className=" font-semibold text-base whitespace-nowrap ">
                  Performance Trend Over Time
                </h4>
              </div>
              <div className="grid grid-cols-12">
                <div className="lg:col-span-2 col-span-12">
                  <div className="mt-1">
                    <PerfLegend
                      checked={checkedList}
                      setChecked={setCheckedList}
                      avgs={legendAverages}
                      colors={[
                        "#00A26A", // AC
                        "#FF5B5B", // CPU
                        "#6D40D4", // ThroughPut
                        "#62B2FD", // Data I/O
                        "#FF8427", // Memory
                      ]}
                    />
                  </div>
                </div>
                <div className="flex-grow lg:col-span-10 col-span-12">
                  {apiLoading && (
                    <div className="text-xs text-gray-400 mb-1">
                      Loading latest trend…
                    </div>
                  )}
                  {apiError && (
                    <div className="text-xs text-red-500 mb-1">
                      Error: {apiError}
                    </div>
                  )}
                  <GenericChart
                    chartType="area"
                    data={trendOverTime}
                    height={512}
                    color={"#00A26A"}
                    datakey={"label"}
                    status={"idle"}
                    msg={() => {}}
                    fill={0}
                    stroke={3}
                    graphColors={[
                      "#00A26A", // AC
                      "#FF5B5B", // CPU
                      "#6D40D4", // ThroughPut
                      "#62B2FD", // Data I/O
                      "#FF8427", // Memory
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white lg:col-span-5 col-span-12 shadow-sm rounded-xl border-2 border-zinc-200">
            <div className="border-b-2 border-gray-200 p-2">
              <h4 className="font-semibold text-base whitespace-nowrap ">
                Application Performance
              </h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
              <div className="text-left border-r-2 border-gray-200 px-2">
                <div className="flex items-center justify-between my-2">
                  <h4 className="font-semibold text-sm whitespace-nowrap my-2 ">
                    Query Type Breakdown
                  </h4>
                  {qbLoading && (
                    <span className="text-xs text-gray-400">Loading…</span>
                  )}
                  {qbError && (
                    <span className="text-xs text-red-500">
                      Error: {qbError}
                    </span>
                  )}
                </div>
                <StackedBar
                  colors={stackedColors}
                  data={breakdownData ?? breakdownMock}
                  height={250}
                  datakey="time"
                  keys={keys}
                  labels={labels}
                  roundedTop
                  radius={16}
                  barSize={40}
                  barCategoryGap="30%"
                  showLegend
                />
              </div>

              <div className="">
                <div className=" my-2 flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row justify-between gap-2 text-left border-r-2 border-gray-200 px-2">
                  <h4 className="font-semibold text-sm whitespace-nowrap  ">
                    Slow Queries
                  </h4>
                  {sqLoading && (
                    <span className="text-xs text-gray-400">Loading…</span>
                  )}
                  {sqError && (
                    <span className="text-xs text-red-500">
                      Error: {sqError}
                    </span>
                  )}
                </div>
                <GenericChart
                  chartType="area"
                  msg={noop}
                  status={"idle"}
                  data={slowQueriesData ?? slowQueriesMock}
                  color={"#131F61"}
                  datakey="label"
                  height={250}
                  fill={2.5}
                  stroke={2.5}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1 border-t-2 border-gray-200">
              <div className="my-2  px-2 flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row justify-between gap-2 text-left border-r-2 border-gray-200 ">
                <h4 className="font-semibold text-sm whitespace-nowrap text-left ">
                  Queries Count
                </h4>
                {qcLoading && (
                  <span className="text-xs text-gray-400">Loading…</span>
                )}
                {qcError && (
                  <span className="text-xs text-red-500">Error: {qcError}</span>
                )}
              </div>
              <GenericChart
                chartType="area"
                msg={noop}
                status={"idle"}
                data={queriesCountData ?? queriesCountMock}
                color={"#131F61"}
                datakey="label"
                height={180}
                fill={2.5}
                stroke={2.5}
              />
            </div>
          </div>
        </div>
        <div className="grid lg:grid-cols-12 grid-cols-1 gap-3 mt-3">
          <div className="col-span-6">
            <div className="bg-white px-3 shadow-sm rounded-xl border-2 border-zinc-200">
              <div className="my-2  px-2 flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row justify-between gap-2 ">
                <h4 className="font-semibold text-base whitespace-nowrap ">
                  Connections
                </h4>
                {/* optional tiny inline status; remove if you don't want any UI change */}
                {connLoading && (
                  <span className="text-xs text-gray-400">Loading…</span>
                )}
                {connError && (
                  <span className="text-xs text-red-500">
                    Error: {connError}
                  </span>
                )}
              </div>

              {/* ✅ same component, just gets data now */}
              <ConnectionsChart data={connectionsSeries} />
            </div>
          </div>

          <div className="col-span-6">
            <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200">
              <div className="border-b-2 border-gray-200 p-2">
                <h4 className="font-semibold text-base whitespace-nowrap ">
                  Locking and Transaction
                </h4>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                <div className="px-3 border-r-2 border-gray-200">
                  <div className="my-2 flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row justify-between gap-2 ">
                    <h4 className="font-semibold text-sm whitespace-nowrap ">
                      Active Transactions
                    </h4>
                    {activeTxnLoading && (
                      <span className="text-xs text-gray-400">Loading…</span>
                    )}
                    {activeTxnError && (
                      <span className="text-xs text-red-500">
                        Error: {activeTxnError}
                      </span>
                    )}
                  </div>
                  <ActiveTransactionsMock
                    height={200}
                    data={activeTxnData ?? undefined}
                  />
                </div>
                <div className="px-3">
                  <div className="my-2 flex flex-col sm:flex-row md:flex-row lg:flex-row xl:flex-row justify-between gap-2 ">
                    <h4 className="font-semibold text-sm whitespace-nowrap">
                      Locks Scatter
                    </h4>
                    {lockLoading && (
                      <span className="text-xs text-gray-400">Loading…</span>
                    )}
                    {lockError && (
                      <span className="text-xs text-red-500">
                        Error: {lockError}
                      </span>
                    )}
                  </div>
                  <LocksScatterMock
                    height={200}
                    data={lockScatterData ?? undefined}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Last 24 Hours</span>
            </div>
            {/* Optional inline status */}
            {perf24Loading && (
              <span className="text-xs text-gray-400">Loading…</span>
            )}
            {perf24Error && (
              <span className="text-xs text-red-500">Error: {perf24Error}</span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {performances24hr.map((record, index) => {
              const isLastCol = index % 4 === 3;
              const diff = record["status(%)"]; // signed number
              const diffAbs = Math.abs(diff);
              const diffClass = diff < 0 ? "text-red-500" : "text-green-500";

              return (
                <div key={`${record.name}-${index}`} className="col-span-1">
                  <div
                    className={`p-3 h-full ${
                      !isLastCol ? "md:border-r-2 border-gray-200" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm whitespace-nowrap">
                          {record.name}
                        </h4>
                        {!selectedRange && (
                          <span className="mt-1 block text-xs text-gray-400">
                            vs Yesterday{" "}
                            <span className={diffClass}>({diffAbs}%)</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base text-blue-900 font-bold">
                        {fixedVal(record.current_value, record.unit)}
                      </h4>
                    </div>

                    <SynchroChart
                      msg={noop}
                      status={fakeStatus}
                      color={
                        synchroChartColors[index % synchroChartColors.length]
                      }
                      data={record.data}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Next 24 Hours</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {performances.map((record, index) => {
              const isLastCol = index % 4 === 3;
              return (
                <div key={`${record.name}-${index}`} className="col-span-1">
                  <div
                    className={`p-3 h-full ${
                      !isLastCol ? "md:border-r-2 border-gray-200" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm whitespace-nowrap">
                          {record.name}
                        </h4>
                        {!selectedRange && (
                          <span className="mt-1 block text-xs text-gray-400">
                            vs Yesterday{" "}
                            <span
                              className={
                                record["status(%)"] <= 10
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              ({record["status(%)"]}%)
                            </span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-base text-blue-900 font-bold">
                        {fixedVal(record.current_value, record.unit)}
                      </h4>
                    </div>

                    <SynchroChart
                      msg={noop}
                      status={fakeStatus}
                      color={
                        synchroChartColors[index % synchroChartColors.length]
                      }
                      data={record.data}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Performance Metrics — Seasonal Forecast (fixed range gated by RangePicker) */}
        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Seasonal Forecast</span>
            </div>
            {/* right-side fixed RangePicker */}
            <div className="flex items-center gap-2">
              <RangePicker
                format="DD-MM-YYYY"
                allowClear
                inputReadOnly
                value={seasonalRange ?? undefined}
                placeholder={["Start date", "End date"]}
                disabledDate={disableOutsideSeasonBounds} // any dates INSIDE bounds are enabled
                onChange={onSeasonalChange}
                renderExtraFooter={() => (
                  <div className="text-xs text-gray-500">
                    Allowed range: {SEASONAL_MIN.format("DD MMM YYYY")} →{" "}
                    {SEASONAL_MAX.format("DD MMM YYYY")}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Body */}
          {!seasonalReady || !seasonalRange ? (
            <div className="p-4 text-sm text-gray-500">
              Select a date range within{" "}
              <span className="font-semibold">
                {SEASONAL_MIN.format("DD MMM YYYY")} →{" "}
                {SEASONAL_MAX.format("DD MMM YYYY")}
              </span>{" "}
              to load the seasonal forecast.
            </div>
          ) : seasonalError ? (
            <div className="p-4 text-sm">
              <div className="text-red-500 mb-2">Error: {seasonalError}</div>
              <button
                onClick={onSeasonalRetry}
                className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {seasonalLoading && (
                <div className="p-3 text-xs text-gray-400">
                  Loading seasonal forecast…
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                {seasonalCards.map((record, index) => {
                  const isLastCol = index % 4 === 3;
                  const color = [
                    "#FF5B5B", // CPU
                    "#17B26A", // Mem
                    "#0BA5EC", // Disk
                    "#F79009", // Net
                  ][index % 4];

                  return (
                    <div
                      key={`seasonal-${record.name}-${index}`}
                      className="col-span-1"
                    >
                      <div
                        className={`p-3 h-full ${
                          !isLastCol ? "md:border-r-2 border-gray-200" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-sm whitespace-nowrap">
                              {record.name}
                            </h4>
                            <span className="mt-1 block text-xs text-gray-400">
                              Daily forecast
                            </span>
                          </div>
                          <h4 className="text-base text-blue-900 font-bold">
                            {fixedVal(record.current_value, record.unit)}
                          </h4>
                        </div>

                        {record.data.length === 0 ? (
                          <div className="mt-3">
                            {seasonalLoading ? (
                              <div className="animate-pulse h-20 w-full rounded-md bg-gray-100" />
                            ) : (
                              <div className="text-xs text-gray-400">
                                No data
                              </div>
                            )}
                          </div>
                        ) : (
                          <SynchroChart
                            msg={() => {}}
                            status={"idle"}
                            color={color}
                            data={record.data}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {/* Performance Metrics — Forecast Trends (hourly next-24 forecast) */}
        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Forecast Trends</span>
            </div>

            <div className="flex items-center gap-2">
              {forecastLoading && (
                <span className="text-xs text-gray-400">Loading…</span>
              )}
              {forecastError && (
                <>
                  <span className="text-xs text-red-500">
                    Error: {forecastError}
                  </span>
                  <button
                    onClick={onForecastRetry}
                    className="ml-2 px-3 py-1 rounded-md border text-xs hover:bg-gray-50"
                  >
                    Retry
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {forecastCards.map((record, index) => {
              const isLastCol = index % 4 === 3;
              const diff = record["status(%)"]; // signed number from summary API
              const diffAbs = Math.abs(diff);
              const diffClass = diff < 0 ? "text-red-500" : "text-green-500";

              const color = [
                "#FF5B5B", // CPU
                "#17B26A", // Memory
                "#0BA5EC", // Disk
                "#F79009", // Network
              ][index % 4];

              return (
                <div
                  key={`forecast-${record.name}-${index}`}
                  className="col-span-1"
                >
                  <div
                    className={`p-3 h-full ${
                      !isLastCol ? "md:border-r-2 border-gray-200" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm whitespace-nowrap">
                          {record.name}
                        </h4>
                        <span className="mt-1 block text-xs text-gray-400">
                          vs Today{" "}
                          <span className={diffClass}>({diffAbs}%)</span>
                        </span>
                      </div>
                      <h4 className="text-base text-blue-900 font-bold">
                        {fixedVal(record.current_value, record.unit)}
                      </h4>
                    </div>

                    {record.data.length === 0 ? (
                      <div className="mt-3">
                        {forecastLoading ? (
                          <div className="animate-pulse h-20 w-full rounded-md bg-gray-100" />
                        ) : (
                          <div className="text-xs text-gray-400">No data</div>
                        )}
                      </div>
                    ) : (
                      <SynchroChart
                        msg={() => {}}
                        status={"idle"}
                        color={color}
                        data={record.data}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default Page;
