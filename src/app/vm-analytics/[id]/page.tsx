/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useMemo, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import Image from "next/image";
import GenericChart from "@/app/components/graphs/GenericChart";
import VmAvailabilityCard from "../../components/cards/VmAvailabilityCard";
import { useRouter, useSearchParams, useParams } from "next/navigation";
const { RangePicker } = DatePicker;
const StackedBar = dynamic(
  () => import("@/app/components/graphs/StackedBarChartComponent"),
  { ssr: false }
);

const DISK_COLORS = { read: "#6D40D4", write: "#0BA5EC" };
const STACKED_COLOR = { read: "#CDC1E9", write: "#947AD0" };
function DiskLegend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: DISK_COLORS.read }}
        />
        Read
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: DISK_COLORS.write }}
        />
        Write
      </span>
    </div>
  );
}

type DiskPoint = { time: string; read: number; write: number };

// ==== Performance Trend API shape ====
type PerfPointApi = { timestamp: string; value: number };
type PerfMetricApi = { total_average: number; graph_data: PerfPointApi[] };
type PerfTrendApi = {
  active_connections: PerfMetricApi;
  memory_usage: PerfMetricApi; 
};
type PerfRow = {
  label: string; // HH:mm
  active_connections?: number;
  memory_utilization?: number; 
};

function twoSeriesDailyToDiskPoints(series: TwoSeriesApi): DiskPoint[] {
  const byTs = new Map<string, { read?: number; write?: number }>();
  for (const p of series.read || [])
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      read: Math.max(0, p.value),
    });
  for (const p of series.write || [])
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      write: Math.max(0, p.value),
    });

  return Array.from(byTs.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([ts, v]) => ({
      time: dayjs(ts).format("DD MMM"),
      read: v.read ?? 0,
      write: v.write ?? 0,
    }));
}

type NetPointApi = { timestamp: string; value: number };
type TwoSeriesApi = { read: NetPointApi[]; write: NetPointApi[] };

// OS
type OsDiskLiveApi = {
  os_disk_throughput: TwoSeriesApi;
  os_disk_operations_per_second: TwoSeriesApi;
};
type OsDiskForecastApi = OsDiskLiveApi; 
const WINDOW_MIN = dayjs("2025-09-11", "YYYY-MM-DD");
const WINDOW_MAX = dayjs("2026-09-11", "YYYY-MM-DD");
const disableOutsideWindow = (d: any) =>
  !d || d.isBefore(WINDOW_MIN, "day") || d.isAfter(WINDOW_MAX, "day");

// DATA
type DataDiskLiveApi = {
  data_disk_throughput: TwoSeriesApi;
  data_disk_operations_per_second: TwoSeriesApi;
};
type DataDiskForecastApi = DataDiskLiveApi; // same keys


type TempDiskLiveApi = {
  temporary_disk_throughput: TwoSeriesApi;
  temporary_disk_latency: NetPointApi[];
};
type TempDiskForecastApi = TempDiskLiveApi; 


function twoSeriesToDiskPoints(
  series: TwoSeriesApi,
  clampNonNeg = false
): DiskPoint[] {
  const byTs = new Map<string, { read?: number; write?: number }>();

  for (const p of series.read || []) {
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      read: clampNonNeg ? Math.max(0, p.value) : p.value,
    });
  }
  for (const p of series.write || []) {
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      write: clampNonNeg ? Math.max(0, p.value) : p.value,
    });
  }

  return Array.from(byTs.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([ts, v]) => ({
      time: dayjs(ts).format("HH:mm"),
      read: v.read ?? 0,
      write: v.write ?? 0,
    }));
}


function oneSeriesLatencyToDiskPoints(
  arr: NetPointApi[],
  clampNonNeg = false
): DiskPoint[] {
  return (arr || [])
    .slice()
    .sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
    )
    .map((p) => ({
      time: dayjs(p.timestamp).format("HH:mm"),
      read: clampNonNeg ? Math.max(0, p.value) : p.value,
      write: 0,
    }));
}

type TwoUpProps = {
  header: string;
  leftTitle: string; 
  rightTitle: string; 
  leftData: DiskPoint[]; 
  rightData: DiskPoint[]; 
};
// ===== TEMPORARY DISK (SEASONAL FORECAST) — prod_vm_2 =====
type TempDiskSeasonalApi = {
  temporary_disk_throughput: TwoSeriesApi;
  temporary_disk_latency: NetPointApi[];
};

function oneSeriesDailyLatencyToDiskPoints(arr: NetPointApi[]): DiskPoint[] {
  return (arr || [])
    .slice()
    .sort((a, b) =>
      a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0
    )
    .map((p) => ({
      time: dayjs(p.timestamp).format("DD MMM"),
      read: Math.max(0, p.value), 
      write: 0,
    }));
}

function TwoUpMetricCard({
  header,
  leftTitle,
  rightTitle,
  leftData,
  rightData,
}: TwoUpProps) {
  return (
    <div className="bg-white shadow-sm  border-2 border-zinc-200 overflow-hidden">
      <div className="border-b-2 border-gray-200 p-2">
        <h2 className="text-md font-bold uppercase">{header}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">

        <div className="px-1 md:border-r-2 border-gray-200">
          <div className="flex items-center justify-between mb-2 px-1">
            <h5 className="text-sm font-semibold text-gray-900">{leftTitle}</h5>
            <DiskLegend />
          </div>
          <GenericChart
            chartType="area"
            msg={() => {}}
            status="idle"
            data={leftData}
            datakey="time"
            height={250}
            stroke={2.5}
            graphColors={[DISK_COLORS.read, DISK_COLORS.write]}
            gradientsByKey={{
              read: {
                from: "rgba(109, 64, 212, 0.3)",
                to: "rgba(255,255,255,0)",
              },
              write: {
                from: "rgba(11, 165, 236, 0.3)",
                to: "rgba(255,255,255,0)",
              },
            }}
          />
        </div>


        <div className="px-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h5 className="text-sm font-semibold text-gray-900">
              {rightTitle}
            </h5>
            <DiskLegend />
          </div>
          <StackedBar
            colors={[STACKED_COLOR.read, STACKED_COLOR.write]}
            data={rightData}
            height={250}
            datakey="time"
            msg={() => {}}
            status="idle"
          />
        </div>
      </div>
    </div>
  );
}
function disabledFutureDates(current: any) {
  return current && current > dayjs().endOf("day");
}



type NetworkPoint = { time: string; inbound: number; outbound: number };

type TwoSeriesDaily = { inbound: NetPointApi[]; outbound: NetPointApi[] };
function mergeTwoSeriesDaily(series: TwoSeriesDaily): NetworkPoint[] {
  const byTs = new Map<string, { inbound?: number; outbound?: number }>();
  for (const p of series.inbound || [])
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      inbound: p.value,
    });
  for (const p of series.outbound || [])
    byTs.set(p.timestamp, {
      ...(byTs.get(p.timestamp) || {}),
      outbound: p.value,
    });

  return Array.from(byTs.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([ts, v]) => ({
      time: dayjs(ts).format("DD MMM"),
      inbound: v.inbound ?? 0,
      outbound: v.outbound ?? 0,
    }));
}

type OverallForecastApi = {
  network_traffic_over_time: TwoSeriesDaily;
  total_network_usage_over_time: TwoSeriesDaily;
};

const NET_COLORS = {
  inbound: "#6F43D5", // light purple
  outbound: "#0BA5EC", // dark purple
};
const STACK_COLOR = {
  inbound: "#CDC1E9", // light purple
  outbound: "#947AD0", // dark purple
};

function NetLegend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: NET_COLORS.inbound }}
        />
        Inbound
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: NET_COLORS.outbound }}
        />
        Outbound
      </span>
    </div>
  );
}

/* --------------------------------- PAGE --------------------------------- */

function Page() {
  const router = useRouter();
  const onBack = () => router.back();

  // 👇 NEW
  const searchParams = useSearchParams();
  const params = useParams<{ id?: string }>();

  const vmParam = searchParams?.get("vm"); 
  const vmTitle =
    vmParam && vmParam.trim().length > 0
      ? decodeURIComponent(vmParam)
      : params?.id
      ? `VM${params.id}`
      : "VM"; 
  type NetPointApiNet = { timestamp: string; value: number };
  type TwoSeriesApiNet = {
    inbound: NetPointApiNet[];
    outbound: NetPointApiNet[];
  };
  type NetworkLiveApi = {
    network_traffic_over_time: TwoSeriesApiNet;
    total_network_usage_over_time: TwoSeriesApiNet;
  };
  const mergeTwoSeriesToChartData = useCallback(
    (series: TwoSeriesApiNet): NetworkPoint[] => {
      const byTs = new Map<string, { inbound?: number; outbound?: number }>();

      for (const p of series.inbound || []) {
        byTs.set(p.timestamp, {
          ...(byTs.get(p.timestamp) || {}),
          inbound: p.value,
        });
      }
      for (const p of series.outbound || []) {
        byTs.set(p.timestamp, {
          ...(byTs.get(p.timestamp) || {}),
          outbound: p.value,
        });
      }

      return Array.from(byTs.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([ts, v]) => ({
          time: dayjs(ts).format("HH:mm"),
          inbound: v.inbound ?? 0,
          outbound: v.outbound ?? 0,
        }));
    },
    []
  );

  const mergeTwoSeriesToChartDataNonNeg = useCallback(
    (series: TwoSeriesApiNet): NetworkPoint[] => {
      const byTs = new Map<string, { inbound?: number; outbound?: number }>();

      for (const p of series.inbound || []) {
        byTs.set(p.timestamp, {
          ...(byTs.get(p.timestamp) || {}),
          inbound: Math.max(0, p.value),
        });
      }
      for (const p of series.outbound || []) {
        byTs.set(p.timestamp, {
          ...(byTs.get(p.timestamp) || {}),
          outbound: Math.max(0, p.value),
        });
      }

      return Array.from(byTs.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
        .map(([ts, v]) => ({
          time: dayjs(ts).format("HH:mm"), // "00:00".."23:00"
          inbound: v.inbound ?? 0,
          outbound: v.outbound ?? 0,
        }));
    },
    []
  );

  /* -------------------- VM Availability: Live API -------------------- */
  type VmAvailabilityApi = {
    total_vms: number;
    affected_vms: number;
    availability_percentage: number;
  };

  type VmAvailabilityUi = {
    total: number;
    affected: number;
    availabilityPct: number;
    lastDowntimeMins: number;
  };

  const [vmAvailability, setVmAvailability] = useState<VmAvailabilityUi>({
    total: 0,
    affected: 0,
    availabilityPct: 0,
    lastDowntimeMins: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          "https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/vm_availability",
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: VmAvailabilityApi = await res.json();
        if (!alive) return;
        setVmAvailability({
          total: data?.total_vms ?? 0,
          affected: data?.affected_vms ?? 0,
          availabilityPct: data?.availability_percentage ?? 0,
          lastDowntimeMins: 0,
        });
      } catch (e) {
        // Soft-fail: keep zeros; avoids UI flicker or crashes
        if (!alive) return;
        console.log(e);
        setVmAvailability((prev) => ({ ...prev }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const PERF_ITEMS = [
    { key: "active_connections", label: "Active connection", colorIndex: 0 },
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

  const [checkedList, setCheckedList] = useState<string[]>([
    "active_connections",
    "memory_utilization",
  ]);

  const [perfStatus, setPerfStatus] = useState<"loading" | "idle" | "error">(
    "loading"
  );
  const [perfRows, setPerfRows] = useState<PerfRow[]>([]);
  const [trendAvgs, setTrendAvgs] = useState({
    active_connections: 0,
    cpu_utilization: 0, 
    throughput: 0, 
    data_io: 0, 
    memory_utilization: 0,
  });

  const trendOverTime = useMemo(() => {
    if (checkedList.length === 0)
      return perfRows.map((r) => ({ label: r.label }));
    return perfRows.map((r) => {
      const out: any = { label: r.label };
      if (
        checkedList.includes("active_connections") &&
        r.active_connections !== undefined
      ) {
        out.active_connections = r.active_connections;
      }
      if (
        checkedList.includes("memory_utilization") &&
        r.memory_utilization !== undefined
      ) {
        out.memory_utilization = r.memory_utilization;
      }
      return out;
    });
  }, [perfRows, checkedList]);

 
  function buildPerfRows(
    ac: PerfPointApi[] = [],
    mem: PerfPointApi[] = []
  ): PerfRow[] {
    const byTs = new Map<string, { ac?: number; mem?: number }>();

    for (const p of ac) {
      byTs.set(p.timestamp, { ...(byTs.get(p.timestamp) || {}), ac: p.value });
    }
    for (const p of mem) {
      byTs.set(p.timestamp, { ...(byTs.get(p.timestamp) || {}), mem: p.value });
    }

    return Array.from(byTs.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
      .map(([ts, v]) => ({
        label: dayjs(ts).format("HH:mm"),
        ...(v.ac !== undefined ? { active_connections: v.ac } : {}),
        ...(v.mem !== undefined ? { memory_utilization: v.mem } : {}),
      }));
  }
  const [liveTraffic, setLiveTraffic] = useState<NetworkPoint[]>([]);
  const [liveUsage, setLiveUsage] = useState<NetworkPoint[]>([]);
  const [netStatus, setNetStatus] = useState<"loading" | "idle" | "error">(
    "loading"
  );


  const vmIdForApi =
    (vmParam && vmParam.trim()) ||
    (params?.id && String(params.id)) ||
    "prod_vm_1"; 

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setNetStatus("loading");
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/vms/${encodeURIComponent(
            vmIdForApi
          )}/network/live`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: NetworkLiveApi = await res.json();

        if (!alive) return;

        const traffic = mergeTwoSeriesToChartData(
          json.network_traffic_over_time
        );
        const usage = mergeTwoSeriesToChartData(
          json.total_network_usage_over_time
        );

        setLiveTraffic(traffic);
        setLiveUsage(usage);
        setNetStatus("idle");
      } catch (e) {
        console.error("Network live fetch failed:", e);
        if (!alive) return;
      
        setNetStatus("error");
      }
    })();
    return () => {
      alive = false;
    };

  }, [vmIdForApi, mergeTwoSeriesToChartData]);

  const [forecastTraffic, setForecastTraffic] = useState<NetworkPoint[]>([]);
  const [forecastUsage, setForecastUsage] = useState<NetworkPoint[]>([]);
  const [forecastStatus, setForecastStatus] = useState<
    "loading" | "idle" | "error"
  >("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setForecastStatus("loading");
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/vms/${encodeURIComponent(
            vmIdForApi
          )}/network/forecast`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: NetworkLiveApi = await res.json(); // same shape as live

        if (!alive) return;

        const traffic = mergeTwoSeriesToChartDataNonNeg(
          json.network_traffic_over_time
        );
        const usage = mergeTwoSeriesToChartDataNonNeg(
          json.total_network_usage_over_time
        );

        setForecastTraffic(traffic);
        setForecastUsage(usage);
        setForecastStatus("idle");
      } catch (e) {
        console.error("Network forecast fetch failed:", e);
        if (!alive) return;
        setForecastStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi, mergeTwoSeriesToChartDataNonNeg]);
  // -------- TEMP DISK (LIVE) --------
  const [tempLiveThroughput, setTempLiveThroughput] = useState<DiskPoint[]>([]);
  const [tempLiveLatency, setTempLiveLatency] = useState<DiskPoint[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/temporary_disk_metrics/live/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TempDiskLiveApi = await res.json();
        if (!alive) return;

        setTempLiveThroughput(
          twoSeriesToDiskPoints(json.temporary_disk_throughput)
        );
        setTempLiveLatency(
          oneSeriesLatencyToDiskPoints(json.temporary_disk_latency)
        );
      } catch (e) {
        console.error("Temp disk live fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);
  const [tempForecastThroughput, setTempForecastThroughput] = useState<
    DiskPoint[]
  >([]);
  const [tempForecastLatency, setTempForecastLatency] = useState<DiskPoint[]>(
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/temporary_disk_metrics/forecast/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TempDiskForecastApi = await res.json();
        if (!alive) return;
        setTempForecastThroughput(
          twoSeriesToDiskPoints(json.temporary_disk_throughput, true)
        );
        setTempForecastLatency(
          oneSeriesLatencyToDiskPoints(json.temporary_disk_latency, true)
        );
      } catch (e) {
        console.error("Temp disk forecast fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);
  const [dataLiveThroughput, setDataLiveThroughput] = useState<DiskPoint[]>([]);
  const [dataLiveOps, setDataLiveOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/data_disk_metrics/live/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: DataDiskLiveApi = await res.json();
        if (!alive) return;

        setDataLiveThroughput(twoSeriesToDiskPoints(json.data_disk_throughput));
        setDataLiveOps(
          twoSeriesToDiskPoints(json.data_disk_operations_per_second)
        );
      } catch (e) {
        console.error("Data disk live fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);
  const [dataForecastThroughput, setDataForecastThroughput] = useState<
    DiskPoint[]
  >([]);
  const [dataForecastOps, setDataForecastOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/data_disk_metrics/forecast/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: DataDiskForecastApi = await res.json();
        if (!alive) return;

        // clamp negatives to 0 for forecast
        setDataForecastThroughput(
          twoSeriesToDiskPoints(json.data_disk_throughput, true)
        );
        setDataForecastOps(
          twoSeriesToDiskPoints(json.data_disk_operations_per_second, true)
        );
      } catch (e) {
        console.error("Data disk forecast fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);

  const [osLiveThroughput, setOsLiveThroughput] = useState<DiskPoint[]>([]);
  const [osLiveOps, setOsLiveOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/os_disk_metrics/live/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: OsDiskLiveApi = await res.json();
        if (!alive) return;

        setOsLiveThroughput(twoSeriesToDiskPoints(json.os_disk_throughput));
        setOsLiveOps(twoSeriesToDiskPoints(json.os_disk_operations_per_second));
      } catch (e) {
        console.error("OS disk live fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);
  const [osForecastThroughput, setOsForecastThroughput] = useState<DiskPoint[]>(
    []
  );
  const [osForecastOps, setOsForecastOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/os_disk_metrics/forecast/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: OsDiskForecastApi = await res.json();
        if (!alive) return;
        setOsForecastThroughput(
          twoSeriesToDiskPoints(json.os_disk_throughput, true)
        );
        setOsForecastOps(
          twoSeriesToDiskPoints(json.os_disk_operations_per_second, true)
        );
      } catch (e) {
        console.error("OS disk forecast fetch failed:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setPerfStatus("loading");
        const res = await fetch(
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/vm_performance_trend/${encodeURIComponent(
            vmIdForApi
          )}`,
          { headers: { accept: "application/json" } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PerfTrendApi = await res.json();
        if (!alive) return;
        const rows = buildPerfRows(
          json.active_connections?.graph_data,
          json.memory_usage?.graph_data
        );

        setPerfRows(rows);

    
        setTrendAvgs((prev) => ({
          ...prev,
          active_connections: Number(
            json.active_connections?.total_average ?? 0
          ),
          memory_utilization: Number(json.memory_usage?.total_average ?? 0),
        }));

        setPerfStatus("idle");
      } catch (e) {
        console.error("Perf trend fetch failed:", e);
        if (!alive) return;
        setPerfStatus("error");
        setPerfRows([]); 
      }
    })();
    return () => {
      alive = false;
    };
  }, [vmIdForApi]);

  const [overallReady, setOverallReady] = useState(false);
  const [overallRange, setOverallRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [overallStatus, setOverallStatus] = useState<
    "idle" | "loading" | "error"
  >("loading"); 

  const [overallErr, setOverallErr] = useState<string | null>(null);
  const [overallTrafficDaily, setOverallTrafficDaily] = useState<
    NetworkPoint[]
  >([]);
  const [overallUsageDaily, setOverallUsageDaily] = useState<NetworkPoint[]>(
    []
  );

  const onOverallRangeChange = (vals: any) => {
    if (!vals || vals.length !== 2) {
      setOverallRange(null);
      setOverallReady(false);
      return;
    }
    const [s, e] = vals;
    const inBounds = !disableOutsideWindow(s) && !disableOutsideWindow(e);
    const ordered = e.isSame(s, "day") || e.isAfter(s, "day");
    if (inBounds && ordered) {
      setOverallRange([s.startOf("day"), e.startOf("day")]);
      setOverallReady(true);
    } else {
      setOverallRange([s, e] as any); 
      setOverallReady(false);
    }
  };


  useEffect(() => {
    if (!overallReady || !overallRange) return;
    let alive = true;
    (async () => {
      try {
        setOverallStatus("loading");
        setOverallErr(null);
        const start = overallRange[0].format("YYYY-MM-DD");
        const end = overallRange[1].format("YYYY-MM-DD");
        const url =
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/network/forecast/overall` +
          `?start_date=${start}&end_date=${end}`;
        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: OverallForecastApi = await res.json();
        if (!alive) return;

        setOverallTrafficDaily(
          mergeTwoSeriesDaily(json.network_traffic_over_time)
        );
        setOverallUsageDaily(
          mergeTwoSeriesDaily(json.total_network_usage_over_time)
        );
        setOverallStatus("idle");
      } catch (e: any) {
        if (!alive) return;
        setOverallStatus("error");
        setOverallErr(e?.message || "Failed to load overall network forecast");
        setOverallTrafficDaily([]);
        setOverallUsageDaily([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [overallReady, overallRange]);


  const seasonalVmId = "prod_vm_2";

  const [osSeasonalReady, setOsSeasonalReady] = useState(false);
  const [seasonalRange, setSeasonalRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);

  const onSeasonalRangeChange = (vals: any) => {
    if (!vals || vals.length !== 2) {
      setSeasonalRange(null);
      setOsSeasonalReady(false);
      return;
    }
    const [s, e] = vals;
    const inBounds = !disableOutsideWindow(s) && !disableOutsideWindow(e);
    const ordered = e.isSame(s, "day") || e.isAfter(s, "day");
    if (inBounds && ordered) {
      setSeasonalRange([s.startOf("day"), e.startOf("day")]);
      setOsSeasonalReady(true);
    } else {
      setSeasonalRange([s, e] as any);
      setOsSeasonalReady(false);
    }
  };

  const [osSeasonalStatus, setOsSeasonalStatus] = useState<
    "idle" | "loading" | "error"
  >("loading");
  const [osSeasonalErr, setOsSeasonalErr] = useState<string | null>(null);
  const [osSeasonalThroughput, setOsSeasonalThroughput] = useState<DiskPoint[]>(
    []
  );
  const [osSeasonalOps, setOsSeasonalOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    if (!osSeasonalReady || !seasonalRange) return;
    let alive = true;
    (async () => {
      try {
        setOsSeasonalStatus("loading");
        setOsSeasonalErr(null);
        const [s, e] = seasonalRange;
        const start = s.format("YYYY-MM-DD");
        const end = e.format("YYYY-MM-DD");
        const url =
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/vms/${encodeURIComponent(
            seasonalVmId
          )}` +
          `/os_disk/forecast/seasonal?start_date=${start}&end_date=${end}`;

        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: {
          os_disk_throughput: TwoSeriesApi;
          os_disk_operations_per_second: TwoSeriesApi;
        } = await res.json();
        if (!alive) return;

        setOsSeasonalThroughput(
          twoSeriesDailyToDiskPoints(json.os_disk_throughput)
        );
        setOsSeasonalOps(
          twoSeriesDailyToDiskPoints(json.os_disk_operations_per_second)
        );
        setOsSeasonalStatus("idle");
      } catch (e: any) {
        if (!alive) return;
        setOsSeasonalStatus("error");
        setOsSeasonalErr(
          e?.message || "Failed to load OS disk seasonal forecast"
        );
        setOsSeasonalThroughput([]);
        setOsSeasonalOps([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [osSeasonalReady, seasonalRange]);
  
  const dataSeasonalVmId = "prod_vm_2";
  const [dataSeasonalReady, setDataSeasonalReady] = useState(false);
  const [dataSeasonalRange, setDataSeasonalRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const onDataSeasonalRangeChange = (vals: any) => {
    if (!vals || vals.length !== 2) {
      setDataSeasonalRange(null);
      setDataSeasonalReady(false);
      return;
    }
    const [s, e] = vals;
    const inBounds = !disableOutsideWindow(s) && !disableOutsideWindow(e);
    const ordered = e.isSame(s, "day") || e.isAfter(s, "day");
    if (inBounds && ordered) {
      setDataSeasonalRange([s.startOf("day"), e.startOf("day")]);
      setDataSeasonalReady(true);
    } else {
      setDataSeasonalRange([s, e] as any);
      setDataSeasonalReady(false);
    }
  };

  const [dataSeasonalStatus, setDataSeasonalStatus] = useState<
    "idle" | "loading" | "error"
  >("loading");
  const [dataSeasonalErr, setDataSeasonalErr] = useState<string | null>(null);
  const [dataSeasonalThroughput, setDataSeasonalThroughput] = useState<
    DiskPoint[]
  >([]);
  const [dataSeasonalOps, setDataSeasonalOps] = useState<DiskPoint[]>([]);

  useEffect(() => {
    if (!dataSeasonalReady || !dataSeasonalRange) return;
    let alive = true;
    (async () => {
      try {
        setDataSeasonalStatus("loading");
        setDataSeasonalErr(null);
        const [s, e] = dataSeasonalRange;
        const start = s.format("YYYY-MM-DD");
        const end = e.format("YYYY-MM-DD");
        const url =
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/vms/${encodeURIComponent(
            dataSeasonalVmId
          )}` +
          `/data_disk/forecast/seasonal?start_date=${start}&end_date=${end}`;

        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: {
          data_disk_throughput: TwoSeriesApi;
          data_disk_operations_per_second: TwoSeriesApi;
        } = await res.json();
        if (!alive) return;

        setDataSeasonalThroughput(
          twoSeriesDailyToDiskPoints(json.data_disk_throughput)
        );
        setDataSeasonalOps(
          twoSeriesDailyToDiskPoints(json.data_disk_operations_per_second)
        );
        setDataSeasonalStatus("idle");
      } catch (e: any) {
        if (!alive) return;
        setDataSeasonalStatus("error");
        setDataSeasonalErr(
          e?.message || "Failed to load Data disk seasonal forecast"
        );
        setDataSeasonalThroughput([]);
        setDataSeasonalOps([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dataSeasonalReady,dataSeasonalRange]);

  const tempSeasonalVmId = "prod_vm_2";
  const [tempSeasonalReady, setTempSeasonalReady] = useState(false);
  const [tempSeasonalRange, setTempSeasonalRange] =
    useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const onTempSeasonalRangeChange = (vals: any) => {
      if (!vals || vals.length !== 2) {
        setTempSeasonalRange(null);
        setTempSeasonalReady(false);
        return;
      }
      const [s, e] = vals;
      const inBounds = !disableOutsideWindow(s) && !disableOutsideWindow(e);
      const ordered  = e.isSame(s, "day") || e.isAfter(s, "day");
      if (inBounds && ordered) {
        setTempSeasonalRange([s.startOf("day"), e.startOf("day")]);
        setTempSeasonalReady(true);
      } else {
        setTempSeasonalRange([s, e] as any);
        setTempSeasonalReady(false);
      }
    };

  const [tempSeasonalStatus, setTempSeasonalStatus] = useState<
    "idle" | "loading" | "error"
  >("loading");
  const [tempSeasonalErr, setTempSeasonalErr] = useState<string | null>(null);
  const [tempSeasonalThroughput, setTempSeasonalThroughput] = useState<
    DiskPoint[]
  >([]);
  const [tempSeasonalLatency, setTempSeasonalLatency] = useState<DiskPoint[]>(
    []
  );



  useEffect(() => {
    if (!tempSeasonalReady || !tempSeasonalRange) return;
    let alive = true;
    (async () => {
      try {
        setTempSeasonalStatus("loading");
        setTempSeasonalErr(null);
        const [s, e] = tempSeasonalRange;
        const start = s.format("YYYY-MM-DD");
        const end = e.format("YYYY-MM-DD");
        const url =
          `https://nmqhfvs3-8000.inc1.devtunnels.ms/vms/${encodeURIComponent(
            tempSeasonalVmId
          )}` +
          `/temporary_disk/forecast/seasonal?start_date=${start}&end_date=${end}`;

        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: TempDiskSeasonalApi = await res.json();
        if (!alive) return;
        setTempSeasonalThroughput(
          twoSeriesDailyToDiskPoints(json.temporary_disk_throughput)
        );
        setTempSeasonalLatency(
          oneSeriesDailyLatencyToDiskPoints(json.temporary_disk_latency)
        );

        setTempSeasonalStatus("idle");
      } catch (e: any) {
        if (!alive) return;
        setTempSeasonalStatus("error");
        setTempSeasonalErr(
          e?.message || "Failed to load Temporary disk seasonal forecast"
        );
        setTempSeasonalThroughput([]);
        setTempSeasonalLatency([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tempSeasonalReady, tempSeasonalRange]);

  return (
    <div className="min-w-80 sm:px-6 p-2 lg:px-8 mb-2">
      <div className="py-1 flex justify-between gap-5 mb-1">
        <div className="flex items-center">
          <Image
            onClick={onBack}
            src="/ops/left.png"
            height={25}
            width={25}
            className="me-3 cursor-pointer"
            alt="back"
          />
          <h4 className="font-bold text-gray-800 text-base">
            Analytics_{vmTitle}
          </h4>
        </div>
        <div className="py-1 flex items-center gap-2 ">
          <DatePicker
            format={"DD-MM-YYYY"}
            defaultValue={dayjs(dayjs(), "YYYY-MM-DD")}
            // onChange={onChange}
            disabledDate={disabledFutureDates}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT: VM Availability (mock) */}
        <div className="lg:col-span-3 col-span-12">
          <VmAvailabilityCard data={vmAvailability} />
        </div>

        {/* MIDDLE: Performance Trend Over Time (MOCK + Recharts) */}
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
                    avgs={trendAvgs}
                    colors={[
                      "#00A26A", 
                      "#FF5B5B", 
                      "#6D40D4", 
                      "#62B2FD", 
                      "#FF8427", 
                    ]}
                  />
                </div>
              </div>
              <div className="flex-grow lg:col-span-10 col-span-12">
                <GenericChart
                  chartType="area"
                  data={trendOverTime}
                  height={512}
                  color={"#00A26A"}
                  datakey={"label"}
                  status={perfStatus}
                  msg={() => {}}
                  stroke={3}
                  graphColors={[
                    "#00A26A",
                    "#FF5B5B",
                    "#6D40D4",
                    "#62B2FD",
                    "#FF8427",
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: NETWORK (MOCK, no WebSockets) */}
        <div className="bg-white lg:col-span-5 col-span-12 shadow-sm rounded-xl border-2 border-zinc-200">
          {/* LIVE */}
          <div className="border-b-2 border-gray-200 p-2">
            <h2 className="text-md font-bold uppercase">
              Network Metrics (Live)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 p-1">
            {/* Traffic Over Time */}
            <div className="text-center border-r-0 lg:border-r-2 border-gray-200 px-2">
              <div className="flex flex-col items-end  gap-2 px-2 my-3">
                <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-20">
                  Network Traffic Over Time
                </h5>
                <NetLegend />
              </div>

              <GenericChart
                chartType="area"
                msg={() => {}}
                status={netStatus}
                data={liveTraffic} 
                datakey="time"
                height={250}
                fill={2.5}
                stroke={2.5}
                graphColors={[NET_COLORS.inbound, NET_COLORS.outbound]}
                gradientsByKey={{
                  inbound: {
                    from: "rgba(109, 64, 212, 0.3)",
                    to: "rgba(255,255,255,0)",
                  },
                  outbound: {
                    from: "rgba(11, 165, 236, 0.3)",
                    to: "rgba(255,255,255,0)",
                  },
                }}
              />
            </div>

            {/* Total Usage Over Time */}
            <div className="px-1">
              <div className="flex flex-col items-end  gap-2 px-2 my-3">
                <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-16">
                  Total Network Usage Over Time
                </h5>
                <NetLegend />
              </div>
              <StackedBar
                colors={[STACK_COLOR.inbound, STACK_COLOR.outbound]}
                data={liveUsage} 
                height={270}
                datakey={"time"}
                msg={() => {}}
                status={netStatus}
              />
            </div>
          </div>

          {/* FORECAST */}
          <div className="border-t-2 border-gray-200 p-2 mt-1 border-b-2">
            <h2 className="text-md font-bold uppercase">
              Network Metrics (Forecast)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 p-1">
            {/* Traffic Over Time (Forecast) */}
            <div className="text-center border-r-0 lg:border-r-2 border-gray-200 px-2">
              <div className="flex flex-col items-end  gap-2 px-2 my-3">
                <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-20">
                  Network Traffic Over Time
                </h5>
                <NetLegend />
              </div>
              <GenericChart
                chartType="area"
                msg={() => {}}
                status={forecastStatus} 
                data={forecastTraffic} 
                datakey="time"
                height={250}
                fill={2.5}
                stroke={2.5}
                graphColors={[NET_COLORS.inbound, NET_COLORS.outbound]}
                gradientsByKey={{
                  inbound: {
                    from: "rgba(109, 64, 212, 0.3)",
                    to: "rgba(255,255,255,0)",
                  },
                  outbound: {
                    from: "rgba(11, 165, 236, 0.3)",
                    to: "rgba(255,255,255,0)",
                  },
                }}
              />
            </div>

            {/* Total Usage Over Time (Forecast) */}
            <div className="px-1">
              <div className="flex flex-col items-end  gap-2 px-2 my-3">
                <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-16">
                  Total Network Usage Over Time
                </h5>
                <NetLegend />
              </div>
              <StackedBar
                colors={[STACK_COLOR.inbound, STACK_COLOR.outbound]}
                data={forecastUsage}
                height={270}
                datakey={"time"}
                msg={() => {}}
                status={forecastStatus} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== NEW ROW: Disk metric composites (LIVE) ===================== */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3">
        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="OS DISK METRICS (LIVE)"
            leftTitle="OS Disk Throughput"
            rightTitle="OS Disk Operations Per Second"
            leftData={osLiveThroughput} 
            rightData={osLiveOps} 
          />
        </div>

        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="DATA DISK METRICS (LIVE)"
            leftTitle="Data Disk Throughput"
            rightTitle="Data Disk Operations Per Second"
            leftData={dataLiveThroughput} 
            rightData={dataLiveOps}
          />
        </div>

        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="TEMPORARY DISK METRICS (LIVE)"
            leftTitle="Temporary Disk Throughput"
            rightTitle="Temporary Disk Latency"
            leftData={tempLiveThroughput} 
            rightData={tempLiveLatency} 
          />
        </div>
      </div>

      {/* ===== ROW: FORECAST ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 ">
        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="OS DISK METRICS (FORECAST)"
            leftTitle="OS Disk Throughput"
            rightTitle="OS Disk Operations Per Second"
            leftData={osForecastThroughput} // ⬅️ from API (clamped ≥0)
            rightData={osForecastOps} // ⬅️ from API (clamped ≥0)
          />
        </div>

        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="DATA DISK METRICS (FORECAST)"
            leftTitle="Data Disk Throughput"
            rightTitle="Data Disk Operations Per Second"
            leftData={dataForecastThroughput} // ⬅️ from API (clamped ≥0)
            rightData={dataForecastOps} // ⬅️ from API (clamped ≥0)
          />
        </div>

        <div className="lg:col-span-4 col-span-12">
          <TwoUpMetricCard
            header="TEMPORARY DISK METRICS (FORECAST)"
            leftTitle="Temporary Disk Throughput"
            rightTitle="Temporary Disk Latency"
            leftData={tempForecastThroughput} // ⬅️ from API (clamped ≥0)
            rightData={tempForecastLatency} // ⬅️ single-series mapped (clamped ≥0)
          />
        </div>
      </div>
      {/* ===== OVERALL 3-MONTHS NETWORK FORECAST ===== */}
      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-base whitespace-nowrap">
              Network — Overall 3 Months Forecast
            </h4>
          </div>

          {/* fixed RangePicker on right */}
          <div className="flex items-center gap-2">
            <RangePicker
              format="DD-MM-YYYY"
              allowClear
              inputReadOnly
              value={overallRange ?? undefined}
              placeholder={["Start date", "End date"]}
              disabledDate={disableOutsideWindow}
              onChange={onOverallRangeChange}
              renderExtraFooter={() => (
                <div className="text-xs text-gray-500">
                  Allowed: {WINDOW_MIN.format("DD MMM YYYY")} →{" "}
                  {WINDOW_MAX.format("DD MMM YYYY")}
                </div>
              )}
            />
          </div>
        </div>

        {!overallReady || !overallRange ? (
          <div className="p-4 text-sm text-gray-500">
            Select a date range within{" "}
            <span className="font-semibold">
              {WINDOW_MIN.format("DD MMM YYYY")} →{" "}
              {WINDOW_MAX.format("DD MMM YYYY")}
            </span>{" "}
            to load the forecast.
          </div>
        ) : overallStatus === "error" ? (
          <div className="p-4 text-sm text-red-600">Error: {overallErr}</div>
        ) : (
          <>
            {overallStatus === "loading" && (
              <div className="p-3 text-xs text-gray-400">
                Loading overall network forecast…
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 p-2">
              {/* Traffic (area) */}
              <div className="text-center border-r-0 lg:border-r-2 border-gray-200 px-2">
                <div className="flex justify-between items-start gap-2 px-2 my-3">
                  <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-20">
                    Network Traffic (Daily)
                  </h5>
                  <NetLegend />
                </div>
                <GenericChart
                  chartType="area"
                  msg={() => {}}
                  status={overallStatus}
                  data={overallTrafficDaily}
                  datakey="time"
                  height={260}
                  fill={2.5}
                  stroke={2.5}
                  graphColors={[NET_COLORS.inbound, NET_COLORS.outbound]}
                  gradientsByKey={{
                    inbound: {
                      from: "rgba(109, 64, 212, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                    outbound: {
                      from: "rgba(11, 165, 236, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                  }}
                />
              </div>

              {/* Total usage (stacked) */}
              <div className="px-1">
                <div className="flex justify-between items-start gap-2 px-2 my-3">
                  <h5 className="text-sm text-gray-900 font-bold whitespace-nowrap mr-16">
                    Total Network Usage (Daily)
                  </h5>
                  <NetLegend />
                </div>
                <StackedBar
                  colors={[STACK_COLOR.inbound, STACK_COLOR.outbound]}
                  data={overallUsageDaily}
                  height={280}
                  datakey={"time"}
                  msg={() => {}}
                  status={overallStatus}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {/* ===== OS DISK (SEASONAL FORECAST) — prod_vm_2 ===== */}
      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <h4 className="font-semibold text-base whitespace-nowrap">
            OS Disk (Seasonal Forecast)
          </h4>
          <RangePicker
            format="DD-MM-YYYY"
            allowClear
            inputReadOnly
            value={seasonalRange ?? undefined}
            onChange={onSeasonalRangeChange}
            disabledDate={disableOutsideWindow}
            placeholder={["Start date", "End date"]}
            renderExtraFooter={() => (
              <div className="text-xs text-gray-500">
                Allowed: {WINDOW_MIN.format("DD MMM YYYY")} →{" "}
                {WINDOW_MAX.format("DD MMM YYYY")}
              </div>
            )}
          />
        </div>

        {osSeasonalStatus === "error" ? (
          <div className="p-4 text-sm text-red-600">Error: {osSeasonalErr}</div>
        ) : (
          <>
            {osSeasonalStatus === "loading" && (
              <div className="p-3 text-xs text-gray-400">
                Loading seasonal forecast…
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
              {/* Throughput (area) */}
              <div className="px-1 md:border-r-2 border-gray-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    OS Disk Throughput (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <GenericChart
                  chartType="area"
                  msg={() => {}}
                  status={osSeasonalStatus}
                  data={osSeasonalThroughput}
                  datakey="time"
                  height={250}
                  stroke={2.5}
                  graphColors={[DISK_COLORS.read, DISK_COLORS.write]}
                  gradientsByKey={{
                    read: {
                      from: "rgba(109, 64, 212, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                    write: {
                      from: "rgba(11, 165, 236, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                  }}
                />
              </div>

              {/* Ops/sec (stacked) */}
              <div className="px-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    OS Disk Operations / Second (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <StackedBar
                  colors={[STACKED_COLOR.read, STACKED_COLOR.write]}
                  data={osSeasonalOps}
                  height={260}
                  datakey="time"
                  msg={() => {}}
                  status={osSeasonalStatus}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {/* ===== DATA DISK (SEASONAL FORECAST) — prod_vm_2 ===== */}
      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <h4 className="font-semibold text-base whitespace-nowrap">
            Data Disk (Seasonal Forecast)
          </h4>
          <RangePicker
            format="DD-MM-YYYY"
            allowClear
            inputReadOnly
            value={dataSeasonalRange ?? undefined}
            onChange={onDataSeasonalRangeChange}
            disabledDate={disableOutsideWindow}
            placeholder={["Start date", "End date"]}
          />
        </div>

        {dataSeasonalStatus === "error" ? (
          <div className="p-4 text-sm text-red-600">
            Error: {dataSeasonalErr}
          </div>
        ) : (
          <>
            {dataSeasonalStatus === "loading" && (
              <div className="p-3 text-xs text-gray-400">
                Loading seasonal forecast…
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
              {/* Throughput (area) */}
              <div className="px-1 md:border-r-2 border-gray-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Data Disk Throughput (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <GenericChart
                  chartType="area"
                  msg={() => {}}
                  status={dataSeasonalStatus}
                  data={dataSeasonalThroughput}
                  datakey="time"
                  height={250}
                  stroke={2.5}
                  graphColors={[DISK_COLORS.read, DISK_COLORS.write]}
                  gradientsByKey={{
                    read: {
                      from: "rgba(109, 64, 212, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                    write: {
                      from: "rgba(11, 165, 236, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                  }}
                />
              </div>

              {/* Ops/sec (stacked) */}
              <div className="px-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Data Disk Operations / Second (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <StackedBar
                  colors={[STACKED_COLOR.read, STACKED_COLOR.write]}
                  data={dataSeasonalOps}
                  height={260}
                  datakey="time"
                  msg={() => {}}
                  status={dataSeasonalStatus}
                />
              </div>
            </div>
          </>
        )}
      </div>
      {/* ===== TEMPORARY DISK (SEASONAL FORECAST) — prod_vm_2 ===== */}
      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <h4 className="font-semibold text-base whitespace-nowrap">
            Temporary Disk (Seasonal Forecast)
          </h4>

          <RangePicker
  format="DD-MM-YYYY"
  allowClear
  inputReadOnly
  value={tempSeasonalRange ?? undefined}
  onChange={onTempSeasonalRangeChange}
  disabledDate={disableOutsideWindow}
  placeholder={["Start date", "End date"]}
/>

        </div>

        {tempSeasonalStatus === "error" ? (
          <div className="p-4 text-sm text-red-600">
            Error: {tempSeasonalErr}
          </div>
        ) : (
          <>
            {tempSeasonalStatus === "loading" && (
              <div className="p-3 text-xs text-gray-400">
                Loading seasonal forecast…
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
              {/* Throughput (area) */}
              <div className="px-1 md:border-r-2 border-gray-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Temporary Disk Throughput (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <GenericChart
                  chartType="area"
                  msg={() => {}}
                  status={tempSeasonalStatus}
                  data={tempSeasonalThroughput}
                  datakey="time"
                  height={250}
                  stroke={2.5}
                  graphColors={[DISK_COLORS.read, DISK_COLORS.write]}
                  gradientsByKey={{
                    read: {
                      from: "rgba(109, 64, 212, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                    write: {
                      from: "rgba(11, 165, 236, 0.3)",
                      to: "rgba(255,255,255,0)",
                    },
                  }}
                />
              </div>

              {/* Latency (stacked; single series on 'read') */}
              <div className="px-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h5 className="text-sm font-semibold text-gray-900">
                    Temporary Disk Latency (Daily)
                  </h5>
                  <DiskLegend />
                </div>
                <StackedBar
                  colors={[STACKED_COLOR.read, STACKED_COLOR.write]}
                  data={tempSeasonalLatency}
                  height={260}
                  datakey="time"
                  msg={() => {}}
                  status={tempSeasonalStatus}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Page;
