/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import dynamic from "next/dynamic";
import { DatePicker, DatePickerProps } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import DbListTable from "../components/tables/DbListTable";

const SynchroChart = dynamic(
  () => import("@/app/components/graphs/SynchronizedAreaChartComponent"),
  { ssr: false }
);

function disabledFutureDates(current: any) {
  return current && current > dayjs().endOf("day");
}
type TrendPoint = { timestamp: string; value: number };

function shapeTrendSeries(list?: TrendPoint[] | null) {
  if (!list || !Array.isArray(list) || list.length === 0) return [];
  return list.map(p => ({
    time: dayjs(p.timestamp).format("HH:mm"),
    value: Number.isFinite(p.value) ? Number(p.value) : 0,
  }));
}

type ApiPoint = { timestamp: string; avg_metric: number };
type PerfApiResponse = {
  today_trend: ApiPoint[];
  today_avg: string;
  yesterday_avg: string;
  difference_from_yesterday: string;
};

type ForecastApiResponse = {
  forecast_value_for_next_24hrs: string;
  difference_between_today_and_forecast: string;
};

type MetricRecord = {
  name: string;
  unit: "%" | "";
  current_value: number;
  diffVsYesterday: number;
  data: Array<{ time: string; value: number }>;
  loading: boolean;
  error?: string | null;
};
const THREE_M_BASE = "https://nmqhfvs3-8000.inc1.devtunnels.ms/forecast/3-months";
const THREE_M_MIN = dayjs("2025-09-11", "YYYY-MM-DD");
const THREE_M_MAX = dayjs("2026-09-11", "YYYY-MM-DD");

type ThreeMonthResp = {
  forecast_metrics: Array<{ timestamp: string; value: number }>;
};

function shapeThreeMonthSeries(api?: ThreeMonthResp | null) {
  if (!api || !Array.isArray(api.forecast_metrics) || api.forecast_metrics.length === 0) {
    return { data: [], current_value: 0 };
  }
  const series = api.forecast_metrics.map((p) => ({
    time: dayjs(p.timestamp).format("DD MMM"),
    value: Number.isFinite(p.value) ? Number(p.value) : 0,
  }));
  const current_value = series[series.length - 1]?.value ?? 0;
  return { data: series, current_value };
}

function disableOutsideBounds(d: any) {
  if (!d) return true;
  return d.isBefore(THREE_M_MIN, "day") || d.isAfter(THREE_M_MAX, "day");
}

const API_BASE = "https://nmqhfvs3-8000.inc1.devtunnels.ms/performance-metrics";
const FORECAST_BASE = "https://nmqhfvs3-8000.inc1.devtunnels.ms/forecast";
const TREND_BASE = "https://nmqhfvs3-8000.inc1.devtunnels.ms/forecast/trend";

function shapeMetric(
  _name: string,
  _unit: "%" | "",
  api?: PerfApiResponse | null
): Omit<MetricRecord, "name" | "unit" | "loading" | "error"> {
  if (!api || !Array.isArray(api.today_trend) || api.today_trend.length === 0) {
    return { data: [], current_value: 0, diffVsYesterday: 0 };
  }
  const series = api.today_trend.map((p) => ({
    time: dayjs(p.timestamp).format("HH:mm"),
    value: Number.isFinite(p.avg_metric) ? Number(p.avg_metric) : 0,
  }));
  const current_value = series[series.length - 1]?.value ?? 0;
  const diffVsYesterday = Number(api.difference_from_yesterday || 0);
  return { data: series, current_value, diffVsYesterday };
}

function variedSeries(value: number): Array<{ time: string; value: number }> {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  return hours.map((h, idx) => {
    const deviation = (Math.sin(idx) * 0.05 * value).toFixed(2);
    return {
      time: String(h).padStart(2, "0") + ":00",
      value: value + Number(deviation),
    };
  });
}

export default function Home() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const onChange: DatePickerProps["onChange"] = (_d, dateString) => {
    if (typeof dateString === "string") {
      setDate(dayjs(dateString, "DD-MM-YYYY").format("YYYY-MM-DD"));
    }
  };

  const [cpu, setCpu] = useState<MetricRecord>({
    name: "CPU Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [mem, setMem] = useState<MetricRecord>({
    name: "Memory Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [disk, setDisk] = useState<MetricRecord>({
    name: "Disk Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [net, setNet] = useState<MetricRecord>({
    name: "Network Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });

  const [cpuF, setCpuF] = useState<MetricRecord>({
    name: "CPU Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [memF, setMemF] = useState<MetricRecord>({
    name: "Memory Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [diskF, setDiskF] = useState<MetricRecord>({
    name: "Disk Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [netF, setNetF] = useState<MetricRecord>({
    name: "Network Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    async function fetchOne(
      key: "cpu" | "memory" | "disk" | "network",
      setter: React.Dispatch<React.SetStateAction<MetricRecord>>
    ) {
      setter((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(`${API_BASE}/${key}`, {
          method: "GET",
          headers: { accept: "application/json" },
          signal,
        });
        if (!res.ok) throw new Error(`${key} api ${res.status}`);
        const json = (await res.json()) as PerfApiResponse | undefined;
        const shaped = shapeMetric(key, "%", json ?? null);
        setter((s) => ({ ...s, ...shaped, loading: false, error: null }));
      } catch (e: any) {
        setter((s) => ({
          ...s,
          loading: false,
          error: e?.name === "AbortError" ? null : "Unable to load data",
        }));
      }
    }

    fetchOne("cpu", setCpu);
    fetchOne("memory", setMem);
    fetchOne("disk", setDisk);
    fetchOne("network", setNet);

    return () => ctrl.abort();
  }, [date]);

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    async function fetchForecast(
      key: "cpu_usage" | "memory_usage" | "disk_usage" | "network_usage",
      setter: React.Dispatch<React.SetStateAction<MetricRecord>>
    ) {
      setter((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(`${FORECAST_BASE}/${key}`, {
          method: "GET",
          headers: { accept: "application/json" },
          signal,
        });
        if (!res.ok) throw new Error(`${key} forecast ${res.status}`);
        const json = (await res.json()) as ForecastApiResponse | undefined;

        const val = Number(json?.forecast_value_for_next_24hrs ?? 0);
        const diff = Number(
          (json?.difference_between_today_and_forecast || "0").replace("+", "")
        );
        const series = variedSeries(val);

        setter((s) => ({
          ...s,
          data: series,
          current_value: val,
          diffVsYesterday: diff,
          loading: false,
          error: null,
        }));
      } catch (e: any) {
        setter((s) => ({
          ...s,
          loading: false,
          error: e?.name === "AbortError" ? null : "Unable to load data",
        }));
      }
    }

    fetchForecast("cpu_usage", setCpuF);
    fetchForecast("memory_usage", setMemF);
    fetchForecast("disk_usage", setDiskF);
    fetchForecast("network_usage", setNetF);

    return () => ctrl.abort();
  }, [date]);

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;

    const MAP = {
      cpu: { valueKey: "cpu_usage" as const, trendKey: "cpu" as const, setter: setCpuF },
      memory: { valueKey: "memory_usage" as const, trendKey: "memory" as const, setter: setMemF },
      disk: { valueKey: "disk_usage" as const, trendKey: "disk" as const, setter: setDiskF },
      network: { valueKey: "network_usage" as const, trendKey: "network" as const, setter: setNetF },
    };

    async function fetchForecastCard(
      valueKey: "cpu_usage" | "memory_usage" | "disk_usage" | "network_usage",
      trendKey: "cpu" | "memory" | "disk" | "network",
      setter: React.Dispatch<React.SetStateAction<MetricRecord>>
    ) {
      setter(s => ({ ...s, loading: true, error: null }));

      try {
        const [valRes, trendRes] = await Promise.all([
          fetch(`${FORECAST_BASE}/${valueKey}`, { headers: { accept: "application/json" }, signal }),
          fetch(`${TREND_BASE}/${trendKey}`, { headers: { accept: "application/json" }, signal }),
        ]);

        if (!valRes.ok) throw new Error(`${valueKey} forecast ${valRes.status}`);
        if (!trendRes.ok) throw new Error(`${trendKey} trend ${trendRes.status}`);

        const valJson = (await valRes.json()) as ForecastApiResponse | undefined;
        const trendJson = (await trendRes.json()) as TrendPoint[] | undefined;

        const currentVal = Number(valJson?.forecast_value_for_next_24hrs ?? 0);
        const diff = Number((valJson?.difference_between_today_and_forecast || "0").replace("+", ""));
        const series = shapeTrendSeries(trendJson);

        setter(s => ({
          ...s,
          data: series,
          current_value: currentVal,
          diffVsYesterday: diff,
          loading: false,
          error: null,
        }));
      } catch (e: any) {
        setter(s => ({
          ...s,
          loading: false,
          error: e?.name === "AbortError" ? null : "Unable to load data",
        }));
      }
    }

    fetchForecastCard(MAP.cpu.valueKey, MAP.cpu.trendKey, MAP.cpu.setter);
    fetchForecastCard(MAP.memory.valueKey, MAP.memory.trendKey, MAP.memory.setter);
    fetchForecastCard(MAP.disk.valueKey, MAP.disk.trendKey, MAP.disk.setter);
    fetchForecastCard(MAP.network.valueKey, MAP.network.trendKey, MAP.network.setter);

    return () => ctrl.abort();
  }, [date]);

  const performances: MetricRecord[] = useMemo(
    () => [cpu, mem, disk, net],
    [cpu, mem, disk, net]
  );
  const forecasts: MetricRecord[] = useMemo(
    () => [cpuF, memF, diskF, netF],
    [cpuF, memF, diskF, netF]
  );

  const synchroChartColors = [
    "#FF5B5B",
    "#17B26A",
    "#0BA5EC",
    "#F79009",
    "#6D40D4",
  ];
  const fixedVal = (val: number, unit: MetricRecord["unit"]) =>
    unit === "%" ? `${Math.round(val)}%` : `${val}`;
  const { RangePicker } = DatePicker;

  const [threeMRange, setThreeMRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [threeMReady, setThreeMReady] = useState(false);

  const onThreeMChange = (vals: any) => {
    if (!vals || vals.length !== 2) {
      setThreeMRange(null);
      setThreeMReady(false);
      return;
    }
    const [s, e] = vals;

    const inBounds = !disableOutsideBounds(s) && !disableOutsideBounds(e);
    const ordered = e.isSame(s, "day") || e.isAfter(s, "day");

    if (inBounds && ordered) {
      setThreeMRange([s.startOf("day"), e.startOf("day")]);
      setThreeMReady(true);
    } else {
      setThreeMRange([s, e] as any);
      setThreeMReady(false);
    }
  };

  const noop = () => {};
  const fakeStatus = "idle";
  const [cpu3M, setCpu3M] = useState<MetricRecord>({
    name: "CPU Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [mem3M, setMem3M] = useState<MetricRecord>({
    name: "Memory Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [disk3M, setDisk3M] = useState<MetricRecord>({
    name: "Disk Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const [net3M, setNet3M] = useState<MetricRecord>({
    name: "Network Usage",
    unit: "%",
    data: [],
    current_value: 0,
    diffVsYesterday: 0,
    loading: true,
    error: null,
  });
  const threeMonth: MetricRecord[] = useMemo(
    () => [cpu3M, mem3M, disk3M, net3M],
    [cpu3M, mem3M, disk3M, net3M]
  );

  useEffect(() => {
    if (!threeMReady || !threeMRange) return;

    const ctrl = new AbortController();
    const { signal } = ctrl;

    const startStr = threeMRange[0].format("YYYY-MM-DD");
    const endStr = threeMRange[1].format("YYYY-MM-DD");

    async function fetch3M(
      key: "cpu_usage" | "memory_usage" | "disk_usage" | "network_usage",
      setter: React.Dispatch<React.SetStateAction<MetricRecord>>
    ) {
      setter((s) => ({ ...s, loading: true, error: null }));
      try {
        const url = `${THREE_M_BASE}/${key}?start_date=${startStr}&end_date=${endStr}`;
        const res = await fetch(url, { method: "GET", headers: { accept: "application/json" }, signal });

        if (!res.ok) throw new Error(`${key} 3m ${res.status}`);
        const json = (await res.json()) as ThreeMonthResp | undefined;

        const shaped = shapeThreeMonthSeries(json ?? null);
        setter((s) => ({
          ...s,
          data: shaped.data,
          current_value: shaped.current_value,
          diffVsYesterday: 0,
          loading: false,
          error: null,
        }));
      } catch (e: any) {
        setter((s) => ({
          ...s,
          loading: false,
          error: e?.name === "AbortError" ? null : "Unable to load data",
        }));
      }
    }

    fetch3M("cpu_usage", setCpu3M);
    fetch3M("memory_usage", setMem3M);
    fetch3M("disk_usage", setDisk3M);
    fetch3M("network_usage", setNet3M);

    return () => ctrl.abort();
  }, [threeMRange, threeMReady]);

  return (
    <div className="min-w-80 sm:px-6 p-2 lg:px-8 mb-5">
      <div className="py-1 flex justify-between items-center">
        <h4 className="font-bold text-gray-800 text-xl">Database</h4>
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
        <DbListTable type="database" title="Overall DB List" />
      </div>

      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-base whitespace-nowrap">
              Performance Metrics
            </h4>
            <span className="text-xs text-gray-400">Last 24 Hours</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {performances.map((record, index) => {
            const isLastCol = index % 4 === 3;
            const color = synchroChartColors[index % synchroChartColors.length];

            return (
              <div key={`${record.name}-live-${index}`} className="col-span-1">
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
                        vs Yesterday{" "}
                        <span
                          className={
                            record.diffVsYesterday >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          ({record.diffVsYesterday >= 0 ? "+" : ""}
                          {Number.isFinite(record.diffVsYesterday)
                            ? record.diffVsYesterday.toFixed(2)
                            : "0"}
                          %)
                        </span>
                      </span>
                    </div>
                    <h4 className="text-base text-blue-900 font-bold">
                      {fixedVal(record.current_value, record.unit)}
                    </h4>
                  </div>

                  {record.loading ? (
                    <div className="mt-3">
                      <div className="animate-pulse h-20 w-full rounded-md bg-gray-100" />
                    </div>
                  ) : record.error ? (
                    <div className="mt-3 text-xs text-red-500">No data</div>
                  ) : record.data.length === 0 ? (
                    <div className="mt-3 text-xs text-gray-400">No data</div>
                  ) : (
                    <SynchroChart
                      msg={noop}
                      status={fakeStatus}
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

      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-base whitespace-nowrap">
              Performance Metrics
            </h4>
            <span className="text-xs text-gray-400">
              Next 24 Hours Forecast
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {forecasts.map((record, index) => {
            const isLastCol = index % 4 === 3;
            const color = synchroChartColors[index % synchroChartColors.length];

            return (
              <div
                key={`${record.name}-forecast-${index}`}
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
                        <span
                          className={
                            record.diffVsYesterday >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          ({record.diffVsYesterday >= 0 ? "+" : ""}
                          {Number.isFinite(record.diffVsYesterday)
                            ? record.diffVsYesterday.toFixed(2)
                            : "0"}
                          %)
                        </span>
                      </span>
                    </div>
                    <h4 className="text-base text-blue-900 font-bold">
                      {fixedVal(record.current_value, record.unit)}
                    </h4>
                  </div>

                  {record.loading ? (
                    <div className="mt-3">
                      <div className="animate-pulse h-20 w-full rounded-md bg-gray-100" />
                    </div>
                  ) : record.error ? (
                    <div className="mt-3 text-xs text-red-500">No data</div>
                  ) : record.data.length === 0 ? (
                    <div className="mt-3 text-xs text-gray-400">No data</div>
                  ) : (
                    <SynchroChart
                      msg={noop}
                      status={fakeStatus}
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

      <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 mt-3">
        <div className="border-b-2 border-gray-200 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-base whitespace-nowrap">Performance Metrics</h4>
            <span className="text-xs text-gray-400">Overall Three Month Forecast</span>
          </div>

          <div className="flex items-center gap-2">
            <RangePicker
              format="DD-MM-YYYY"
              allowClear
              inputReadOnly
              value={threeMRange ?? undefined}
              placeholder={["Start date", "End date"]}
              disabledDate={disableOutsideBounds}
              onChange={onThreeMChange}
              renderExtraFooter={() => (
                <div className="text-xs text-gray-500">
                  Allowed range: {THREE_M_MIN.format("DD MMM YYYY")} → {THREE_M_MAX.format("DD MMM YYYY")}
                </div>
              )}
            />
          </div>
        </div>

        {!threeMReady ? (
          <div className="p-4 text-sm text-gray-500">
            Please <span className="font-semibold">select the date range</span> to load the forecast.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {threeMonth.map((record, index) => {
              const isLastCol = index % 4 === 3;
              const color = synchroChartColors[index % synchroChartColors.length];

              return (
                <div key={`${record.name}-3m-${index}`} className="col-span-1">
                  <div className={`p-3 h-full ${!isLastCol ? "md:border-r-2 border-gray-200" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm whitespace-nowrap">{record.name}</h4>
                        <span className="mt-1 block text-xs text-gray-400">Daily forecast</span>
                      </div>
                      <h4 className="text-base text-blue-900 font-bold">
                        {fixedVal(record.current_value, record.unit)}
                      </h4>
                    </div>

                    {record.loading ? (
                      <div className="mt-3"><div className="animate-pulse h-20 w-full rounded-md bg-gray-100" /></div>
                    ) : record.error ? (
                      <div className="mt-3 text-xs text-red-500">No data</div>
                    ) : record.data.length === 0 ? (
                      <div className="mt-3 text-xs text-gray-400">No data</div>
                    ) : (
                      <SynchroChart msg={noop} status={fakeStatus} color={color} data={record.data} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
