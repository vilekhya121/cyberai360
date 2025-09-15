/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import dynamic from "next/dynamic";
import { DatePicker, DatePickerProps } from "antd";
import { useState, useEffect} from "react";

import dayjs from "dayjs";

import DbListTable from "../components/tables/DbListTable";
const { RangePicker } = DatePicker;

const SynchroChart = dynamic(
  () => import("@/app/components/graphs/SynchronizedAreaChartComponent"),
  { ssr: false }
);

type MetricRecord = {
  name: string;
  unit: "%" | "";
  current_value: number;

  ["status(%)"]: number;
 
  data: Array<{ time: string; value: number }>;
};

type ApiPoint = { timestamp: string; value: number };
type ApiMetric = { difference_value: number; graph_data: ApiPoint[] };
type TrendsApi = {
  active_connections: ApiMetric;
  memory_usage: ApiMetric;
};

function disabledFutureDates(current: any) {
  return current && current > dayjs().endOf("day");
}

const TRENDS_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/performance_trends";
const FORECAST_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/dashboard/performance_forecast";

  const Q3M_API =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/metrics/forecast/3-months/vm-usage";


const Q3M_MIN = dayjs("2025-09-11", "YYYY-MM-DD");
const Q3M_MAX = dayjs("2026-09-11", "YYYY-MM-DD");


function disableOutsideQ3M(d: any) {
  if (!d) return true;
  return d.isBefore(Q3M_MIN, "day") || d.isAfter(Q3M_MAX, "day");
}


function shapeDailySeries(
  rows: { timestamp: string; value: number }[],
  unit: "%" | "" = ""
): Pick<MetricRecord, "data" | "current_value" | "unit"> {
  const data = (rows ?? []).map(p => ({
    time: dayjs(p.timestamp).format("DD MMM"),
    value: Number(p.value ?? 0),
  }));
  const current_value = data.at(-1)?.value ?? 0;
  return { data, current_value, unit };
}

const toHHmm = (ts: string) => dayjs(ts).format("HH:mm");

function aggregateByTimestamp(points: ApiPoint[]): ApiPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const p of points) {
    const key = p.timestamp;
    const b = buckets.get(key);
    if (b) {
      b.sum += p.value;
      b.count += 1;
    } else {
      buckets.set(key, { sum: p.value, count: 1 });
    }
  }
  const out: ApiPoint[] = [];
  for (const [ts, { sum, count }] of buckets) {
    out.push({ timestamp: ts, value: sum / count });
  }

  out.sort((a, b) => dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf());
  return out;
}

function toMetricRecord(
  label: string,
  api: ApiMetric,
  { unit = "" as "%" | "", aggregate = false } = {}
): MetricRecord {
  const series = aggregate ? aggregateByTimestamp(api.graph_data) : api.graph_data;

  const chartData = series.map((p) => ({
    time: toHHmm(p.timestamp),
    value: p.value,
  }));

  const lastVal =
    series.length > 0 ? Number(series[series.length - 1].value) : 0;

  return {
    name: label,
    unit,
    current_value: lastVal,
    ["status(%)"]: Number(api.difference_value?.toFixed(1) ?? 0),
    data: chartData,
  };
}

export default function Home() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    if (typeof dateString === "string") {
      setDate(dayjs(dateString, "DD-MM-YYYY").format("YYYY-MM-DD"));
      setSelectedRange(null);
    }
  };



  const synchroChartColors = ["#FF5B5B", "#17B26A", "#0BA5EC", "#F79009", "#6D40D4"];

  const [trendMetrics, setTrendMetrics] = useState<MetricRecord[]>([]);
  const [forecastMetrics, setForecastMetrics] = useState<MetricRecord[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [errorTrends, setErrorTrends] = useState<string | null>(null);
  const [errorForecast, setErrorForecast] = useState<string | null>(null);

  useEffect(() => {
 
    let cancelled = false;
    async function loadTrends() {
      try {
        setLoadingTrends(true);
        setErrorTrends(null);
        const res = await fetch(TRENDS_URL, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TrendsApi = await res.json();

        if (cancelled) return;
        const records: MetricRecord[] = [
          toMetricRecord("Active Connections", json.active_connections, { unit: "" }),
          toMetricRecord("Memory Usage", json.memory_usage, { unit: "" }),
        ];
        setTrendMetrics(records);
      } catch (e: any) {
        if (!cancelled) setErrorTrends(e?.message ?? "Failed to load trends");
      } finally {
        if (!cancelled) setLoadingTrends(false);
      }
    }
    loadTrends();
    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => {
   
    let cancelled = false;
    async function loadForecast() {
      try {
        setLoadingForecast(true);
        setErrorForecast(null);
        const res = await fetch(FORECAST_URL, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: TrendsApi = await res.json();

        if (cancelled) return;
        const records: MetricRecord[] = [
          toMetricRecord("Active Connections", json.active_connections, {
            unit: "",
            aggregate: true, 
          }),
          toMetricRecord("Memory Usage", json.memory_usage, {
            unit: "",
            aggregate: true,
          }),
        ];
        setForecastMetrics(records);
      } catch (e: any) {
        if (!cancelled) setErrorForecast(e?.message ?? "Failed to load forecast");
      } finally {
        if (!cancelled) setLoadingForecast(false);
      }
    }
    loadForecast();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const fixedVal = (val: number, unit: any) =>
    unit !== "%" ? `${val}` : `${Math.floor(val)}%`;

  const noop = () => {};
  const fakeStatus = "idle";

  const [q3mRange, setQ3mRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [q3mReady, setQ3mReady] = useState(false);
const [q3mLoading, setQ3mLoading] = useState(false);
const [q3mError, setQ3mError] = useState<string | null>(null);
const [q3mRefetch, setQ3mRefetch] = useState(0);
const onQ3mRetry = () => setQ3mRefetch(n => n + 1);

const onQ3mChange = (vals: any) => {
  if (!vals || vals.length !== 2) {
    setQ3mRange(null);
    setQ3mReady(false);
    return;
  }
  const [s, e] = vals;


  const inBounds = !disableOutsideQ3M(s) && !disableOutsideQ3M(e);
  const ordered  = e.isSame(s, "day") || e.isAfter(s, "day");

  if (inBounds && ordered) {
    setQ3mRange([s.startOf("day"), e.startOf("day")]);
    setQ3mReady(true);
  } else {
    setQ3mRange([s, e] as any);
    setQ3mReady(false);
  }
};


const [q3mActive, setQ3mActive] = useState<MetricRecord>({
  name: "Active Connections", unit: "", current_value: 0, ["status(%)"]: 0, data: [],
});
const [q3mMemory, setQ3mMemory] = useState<MetricRecord>({
  name: "Memory Usage", unit: "", current_value: 0, ["status(%)"]: 0, data: [],
});
useEffect(() => {
  if (!q3mReady || !q3mRange) return;
  let cancelled = false;

  (async () => {
    try {
      setQ3mLoading(true);
      setQ3mError(null);

      const startStr = q3mRange[0].format("YYYY-MM-DD");
      const endStr   = q3mRange[1].format("YYYY-MM-DD");

      const url = `${Q3M_API}?start_date=${startStr}&end_date=${endStr}`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: {
        memory_metrics: { timestamp: string; value: number }[];
        active_connections: { timestamp: string; value: number }[];
      } = await res.json();
      if (cancelled) return;


      const ac = shapeDailySeries(json.active_connections, "");
      const mem = shapeDailySeries(json.memory_metrics, "");

      setQ3mActive(s => ({ ...s, data: ac.data, current_value: ac.current_value }));
      setQ3mMemory(s => ({ ...s, data: mem.data, current_value: mem.current_value }));
    } catch (e: any) {
      if (!cancelled) setQ3mError(e?.message ?? "Failed to load 3-month forecast");
    } finally {
      if (!cancelled) setQ3mLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [q3mReady, q3mRefetch, q3mRange]);

  return (
    <div className="min-w-80 sm:px-6 p-2 lg:px-8 mb-5">
      <div className="py-1 flex justify-between">
        <h4 className="font-bold text-gray-800 text-xl">VM</h4>
        <div className="flex items-center gap-4">
          <DatePicker
            format={"DD-MM-YYYY"}
            defaultValue={dayjs(dayjs(), "YYYY-MM-DD")}
            onChange={onChange}
            disabledDate={disabledFutureDates}
            allowClear={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 gap-4">
        <DbListTable type="vm" title="Overall VM List" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ---------- Card 1: Last 24 Hours (Trends API) ---------- */}
        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Last 24 Hours</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {errorTrends ? (
              <div className="col-span-2 p-3 text-sm text-red-600">{errorTrends}</div>
            ) : (loadingTrends && trendMetrics.length === 0) ? (
              <div className="col-span-2 p-3 text-sm text-gray-500">Loading…</div>
            ) : trendMetrics.length === 0 ? (
              <div className="col-span-2 p-3 text-sm text-gray-500">No data</div>
            ) : (
              trendMetrics.map((record, index) => {
                const addRightBorderOnMd = index % 2 === 0;
                return (
                  <div key={`${record.name}-trend`} className="col-span-1">
                    <div
                      className={`p-3 h-full ${
                        addRightBorderOnMd ? "md:border-r-2 border-gray-200" : ""
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
                        color={synchroChartColors[index % synchroChartColors.length]}
                        data={record.data}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- Card 2: Next 24 Hour Forecast (Forecast API) ---------- */}
        <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
          <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-base whitespace-nowrap">
                Performance Metrics
              </h4>
              <span className="text-xs text-gray-400">Next 24 Hour Forecast</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {errorForecast ? (
              <div className="col-span-2 p-3 text-sm text-red-600">{errorForecast}</div>
            ) : (loadingForecast && forecastMetrics.length === 0) ? (
              <div className="col-span-2 p-3 text-sm text-gray-500">Loading…</div>
            ) : forecastMetrics.length === 0 ? (
              <div className="col-span-2 p-3 text-sm text-gray-500">No data</div>
            ) : (
              forecastMetrics.map((record, index) => {
                const addRightBorderOnMd = index % 2 === 0;
                return (
                  <div key={`${record.name}-forecast`} className="col-span-1">
                    <div
                      className={`p-3 h-full ${
                        addRightBorderOnMd ? "md:border-r-2 border-gray-200" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-sm whitespace-nowrap">
                            {record.name}
                          </h4>
                          {!selectedRange && (
                            <span className="mt-1 block text-xs text-gray-400">
                              vs Today{" "}
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
                        color={synchroChartColors[index % synchroChartColors.length]}
                        data={record.data}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* ---------- Card 3: Overall 3 Months VM Usage Forecast ---------- */}
<div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
  <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h4 className="font-semibold text-base whitespace-nowrap">
        Performance Metrics
      </h4>
      <span className="text-xs text-gray-400">
        Overall 3 Months VM Usage Forecast
      </span>
    </div>
    <div className="flex items-center gap-2">
    <RangePicker
  format="DD-MM-YYYY"
  allowClear
  inputReadOnly
  value={q3mRange ?? undefined}
  placeholder={["Start date", "End date"]}
  disabledDate={disableOutsideQ3M}   
  onChange={onQ3mChange}
  renderExtraFooter={() => (
    <div className="text-xs text-gray-500">
      Allowed range: {Q3M_MIN.format("DD MMM YYYY")} → {Q3M_MAX.format("DD MMM YYYY")}
    </div>
  )}
/>
    </div>
  </div>

  {!q3mReady || !q3mRange ? (
  <div className="p-4 text-sm text-gray-500">
    Select a date range within{" "}
    <span className="font-semibold">
      {Q3M_MIN.format("DD MMM YYYY")} → {Q3M_MAX.format("DD MMM YYYY")}
    </span>{" "}
    to load the forecast.
  </div>
  ) : q3mError ? (
    <div className="p-4 text-sm">
      <div className="text-red-500 mb-2">Error: {q3mError}</div>
      <button
        onClick={onQ3mRetry}
        className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50"
      >
        Retry
      </button>
    </div>
  ) : (
    <>
      {q3mLoading && (
        <div className="p-3 text-xs text-gray-400">
          Loading overall 3-month forecast…
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
        {[q3mActive, q3mMemory].map((record, index) => {
          const addRightBorderOnMd = index % 2 === 0;
          const color = [
            "#00A26A", 
            "#FF8427", 
          ][index % 2];

          return (
            <div key={`q3m-${record.name}`} className="col-span-1">
              <div className={`p-3 h-full ${addRightBorderOnMd ? "md:border-r-2 border-gray-200" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm whitespace-nowrap">{record.name}</h4>
                    <span className="mt-1 block text-xs text-gray-400">Daily forecast</span>
                  </div>
                  <h4 className="text-base text-blue-900 font-bold">
                    {fixedVal(record.current_value, record.unit)}
                  </h4>
                </div>

                {record.data.length === 0 ? (
                  <div className="mt-3">
                    {q3mLoading ? (
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
    </>
  )}
</div>

    </div>
  );
}
