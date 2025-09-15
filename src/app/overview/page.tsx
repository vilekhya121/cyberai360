/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import ALARM_ICON from "../../../public/alert.png";
import Check from "../../../public/Check.png";
import Alert from "../../../public/Alertcircle.png";
import dayjs from "dayjs";
import { DatePicker, DatePickerProps } from "antd";
type AlarmItem = {
  id: number;
  title: string;
  time: string;
  iconSrc?: string | StaticImageData;
};
type SnapshotRow = {
  name: string;
  alarms: number;
  devices: number;
  problematic: number;
  status: "error" | "ok";
  icon: string;
};
const snapshot: SnapshotRow[] = [
  {
    name: "Server",
    alarms: 215,
    devices: 20,
    problematic: 7,
    status: "error",
    icon: "/icons/status-error.svg",
  },
  {
    name: "Router",
    alarms: 2,
    devices: 1,
    problematic: 1,
    status: "error",
    icon: "/icons/status-error.svg",
  },
  {
    name: "Switch",
    alarms: 1,
    devices: 2,
    problematic: 1,
    status: "error",
    icon: "/icons/status-error.svg",
  },
  {
    name: "Desktop",
    alarms: 8,
    devices: 3,
    problematic: 2,
    status: "error",
    icon: "/icons/status-error.svg",
  },
  {
    name: "Domain Controller",
    alarms: 49,
    devices: 2,
    problematic: 2,
    status: "error",
    icon: "/icons/status-error.svg",
  },
  {
    name: "Load Balancer",
    alarms: 0,
    devices: 3,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Wireless",
    alarms: 0,
    devices: 0,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "UPS",
    alarms: 0,
    devices: 4,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Printer",
    alarms: 0,
    devices: 0,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Unknown",
    alarms: 0,
    devices: 1,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Storage",
    alarms: 0,
    devices: 0,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Load Balancer",
    alarms: 0,
    devices: 3,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
  {
    name: "Wireless",
    alarms: 0,
    devices: 0,
    problematic: 0,
    status: "ok",
    icon: "/icons/status-ok.svg",
  },
];
const SnapshotTable = ({ rows }: { rows: SnapshotRow[] }) => {
  return (
    <div className="h-[770px] flex flex-col">

      <div className="grid grid-cols-12 items-center bg-gray-50 px-4 py-2 rounded-md mb-2 flex-shrink-0">
        <div className="col-span-3 text-[12px] font-semibold text-gray-600">
          Name
        </div>
        <div className="col-span-3 text-[12px] font-semibold text-gray-600">
          Alarms
        </div>
        <div className="col-span-3 text-[12px] font-semibold text-gray-600">
          Devices
        </div>
        <div className="col-span-3 text-[12px] font-semibold text-gray-600">
          Problematic Devices
        </div>
      </div>


      <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
        {rows.map((r) => {
          const isError = r.status === "error";
          return (
            <div
              key={r.name}
              className="grid grid-cols-12 items-center px-4 py-3.5"
            >
        
              <div className="col-span-5 flex items-center gap-3">
                <Image
                  src={isError ? Alert : Check}
                  alt={isError ? "Error" : "OK"}
                  width={10}
                  height={10}
                />
                <span className="text-[14px] text-gray-800 leading-snug">
                  {r.name}
                </span>
              </div>

              <div className="col-span-2 text-sm font-semibold text-gray-900">
                {r.alarms}
              </div>
              <div className="col-span-2 text-sm text-gray-800">
                {r.devices}
              </div>
              <div className="col-span-3 text-sm text-gray-800">
                {r.problematic}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// ==== CPU Utilization API ====
const CPU_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/metrics/cpu-utilization";

function parseCpuRows(raw: unknown): MemoryRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any) => ({
    name: String(r?.device_name ?? "—"),
    min: Math.round(Number(r?.cpu_min_usage ?? 0)),
    avg: Math.round(Number(r?.cpu_avg_usage ?? 0)),
  }));
}

function parseIpResponse(raw: unknown) {
  const src = (raw ?? {}) as Record<string, unknown>;


  const lower: Record<string, number> = {};
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === "number") lower[k.toLowerCase()] = v;
  }

  const used = lower.used ?? 0;
  const available = lower.available ?? 0;
  const transient = lower.transient ?? 0;

  const total = used + available + transient;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return {
    used,
    available,
    transient,
    total,
    usedPct: pct(used),
    availablePct: pct(available),
    transientPct: pct(transient),
  };
}
// ==== Memory Utilization API ====
const MEM_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/metrics/memory-utilization";


type MemRow = { name: string; min: number; avg: number };

function parseMemoryRows(raw: unknown): MemRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any) => ({
    name: String(r?.device_name ?? "—"),
   
    min: Math.round(Number(r?.memory_min_usage ?? 0)),
    avg: Math.round(Number(r?.memory_avg_usage ?? 0)),
  }));
}


const MemoryTableSkeleton = () => (
  <>
    <div className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-4 py-2.5 mb-2">
      <div className="text-[12px] font-semibold text-gray-600">Device Name</div>
      <div className="text-center text-[12px] font-semibold text-gray-600">
        MIN
      </div>
      <div className="text-center text-[12px] font-semibold text-gray-600">
        AVG
      </div>
    </div>
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="grid grid-cols-3 items-center py-4">
          <div className="px-1">
            <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex justify-center">
            <div className="h-5 w-8 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex justify-center">
            <div className="h-6 w-14 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  </>
);


const HEATMAP_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/counts/device-status";


function parseHeatResponse(raw: unknown) {
  const src = (raw ?? {}) as Record<string, unknown>;


  const norm: Record<string, number> = {};
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === "number") {
      const key = k.toLowerCase().replace(/[\s_]+/g, "");
      norm[key] = v;
    }
  }

  const clear = norm.clear ?? 0;
  const critical = norm.critical ?? 0;
  const attention = norm.attention ?? norm.warning ?? 0;
  const serviceDown = norm.servicedown ?? 0; 
  const trouble = norm.trouble ?? norm.minor ?? 0;

  const total =
    norm.total ?? clear + critical + attention + serviceDown + trouble;

  return { clear, critical, attention, serviceDown, trouble, total };
}

const VOLS_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/metrics/volumes-by-disk-usage";

type VolumeRow = { name: string; vol: string; util: number };

function parseVolumeRows(raw: unknown): VolumeRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any) => ({
    name: String(r?.device_name ?? "—"),
    vol: r?.disk_volume ? String(r.disk_volume) : "—",
    util: Math.round(Number(r?.disk_usage ?? 0)),
  }));
}


const VolumesTableSkeleton = () => (
  <>
    <div className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-4 py-2.5 mb-3">
      <div className="text-[12px] font-semibold text-gray-600">Device Name</div>
      <div className="text-[12px] font-semibold text-gray-600">Volume</div>
      <div className="text-right text-[12px] font-semibold text-gray-600">
        utilization%
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-3 items-center py-4 px-4">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="flex justify-end">
            <div className="h-6 w-14 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </>
);
const IFACES_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/interfaces";

type InterfaceItem = { id: number; title: string; time: string; icon: string };

function parseInterfaces(raw: unknown): InterfaceItem[] {
  if (!Array.isArray(raw)) return [];
  // newest first
  const rows = [...(raw as any[])].sort(
    (a, b) =>
      new Date(b?.interface_timestamp ?? 0).getTime() -
      new Date(a?.interface_timestamp ?? 0).getTime()
  );

  return rows.map((r, i) => {
    const iso = String(r?.interface_timestamp ?? "");
    const title = String(r?.interface_name ?? "—");
    const formatted = dayjs(iso).isValid()
      ? dayjs(iso).format("DD MMM YYYY hh:mm:ss A") // matches your style
      : iso || "—";
    return { id: i, title, time: formatted, icon: "⚠️" };
  });
}

// Skeleton that matches your list layout/height
const InterfacesSkeleton = () => (
  <div className="max-h-[360px] overflow-y-auto p-4">
    <ul className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="relative flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-60 bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  </div>
);
// ==== Recent Alarms API ====
const ALARMS_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/alarms/recent";

function parseRecentAlarms(raw: unknown): AlarmItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();

  return [...(raw as any[])]
    .sort(
      (a, b) =>
        new Date(b?.last_alarm_timestamp ?? 0).getTime() -
        new Date(a?.last_alarm_timestamp ?? 0).getTime()
    )
    .filter((r) => {
      const key = `${r?.last_alarm_id}|${r?.device_name}|${r?.last_alarm_timestamp}`;
      if (seen.has(key)) return false; // dedupe exact duplicates from API
      seen.add(key);
      return true;
    })
    .map((r, i) => {
      const ts = String(r?.last_alarm_timestamp ?? "");
      const time = dayjs(ts).isValid()
        ? dayjs(ts).format("DD MMM YYYY hh:mm:ss A")
        : ts || "—";
      const id = String(r?.last_alarm_id ?? "—");
      const src = String(r?.last_alarm_src ?? "—");
      const dev = String(r?.device_name ?? "—");
      const title = `${id} • ${src} • ${dev}`;

      return { id: i, title, time } as AlarmItem; 
    });
}


const RecentAlarmsSkeleton = () => (
  <div className="p-4">
    <div className="max-h-[770px] overflow-auto space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
          <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-72 bg-gray-100 rounded mb-2 animate-pulse" />
            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SNAPSHOT_URL =
  "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/infrastructure-snapshot";

function parseSnapshotRows(raw: unknown): SnapshotRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as any[]).map((r) => {
    const alarms = Number(r?.alarms ?? 0);
    const devices = Number(r?.devices ?? 0);
    const problematic = Number(r?.problematic_devices ?? 0);
    const status: "error" | "ok" =
      alarms > 0 || problematic > 0 ? "error" : "ok";
    return {
      name: String(r?.name ?? "—"),
      alarms,
      devices,
      problematic,
      status,

      icon: status === "error" ? "/icons/status-error.svg" : "/icons/status-ok.svg",
    } as SnapshotRow;
  });
}

/** ---------- tiny ui primitives ---------- */
const Card = ({
  title,
  children,
  className = "",
  action,
  headerClassName = "",
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  headerClassName?: string; 
}) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
  >
    {(title || action) && (
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-100 rounded-t-2xl ${headerClassName}`}
      >
        {typeof title === "string" ? (
          <h3 className="text-sm whitespace-nowrap font-semibold text-gray-800">
            {title}
          </h3>
        ) : (
          title
        )}
        {action}
      </div>
    )}
    {children}
  </div>
);
const InterfacesErrorsList = ({
  items,
}: {
  items: { title: string; time: string; icon: string; id: number }[];
}) => (

  <div className="max-h-[360px] overflow-y-auto p-4">
    <ul className="space-y-1">
      {items.map((it) => (
        <li
          key={it.id}
          className="relative flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >


          <Image src={ALARM_ICON} alt="Alert" width={20} height={20} />

          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-[#2A58A5]">
              {it.title}
            </div>
            <div className=" text-[11px] font-medium text-gray-500">
              {it.time}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const ProgressPill = ({ value }: { value: number }) => {
  const tone =
    value >= 90
      ? "red"
      : value >= 70
      ? "yellow"
      : ("green" as "red" | "yellow" | "green");

  const map = {
    red: "text-rose-600 border-rose-300 bg-rose-50",
    yellow: "text-amber-600 border-amber-300 bg-amber-50",
    green: "text-emerald-600 border-emerald-300 bg-emerald-50",
  } as const;

  return (
    <span
      className={`inline-flex min-w-[44px] justify-center px-3 py-1 rounded-full text-xs font-semibold border ${map[tone]}`}
    >
      {value}
    </span>
  );
};
const IpPillBars = ({
  used = 18,
  transient = 78,
  available = 44,
  trackHeight = 190,
}: {
  used?: number;
  transient?: number;
  available?: number;
  trackHeight?: number;
}) => {
  return (
    <div className="flex items-end justify-center gap-1">
      {/* Used - Red */}
      <div
        className="bg-gray-100 rounded-lg relative"
        style={{ width: "40px", height: trackHeight }}
      >
        <div
          className="absolute bottom-2 left-2 right-2 rounded-lg"
          style={{
            height: `${used}%`,
            backgroundColor: "#E86761",
          }}
        />
      </div>

      {/* Transient - Orange */}
      <div
        className="bg-gray-100 rounded-lg relative"
        style={{ width: "40px", height: trackHeight }}
      >
        <div
          className="absolute bottom-2 left-2 right-2 rounded-lg"
          style={{
            height: `${transient}%`,
            backgroundColor: "#EFAF69",
          }}
        />
      </div>

      {/* Available - Green */}
      <div
        className="bg-gray-100 rounded-lg relative"
        style={{ width: "40px", height: trackHeight }}
      >
        <div
          className="absolute bottom-2 left-2 right-2 rounded-lg"
          style={{
            height: `${available}%`,
            backgroundColor: "#68B882",
          }}
        />
      </div>
    </div>
  );
};

const KpiRow = ({
  value,
  label,
  color,
}: {
  value: number | string;
  label: string;
  color: string;
}) => (
  <div className="space-y-0.5">
    <div className="text-3xl font-extrabold" style={{ color }}>
      {value}
    </div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);
//donout chart
type DonutSegment = { label: string; color: string; weight?: number };

const Donut = ({
  value = 0,
  size = 208,
  thickness = 28,
  segments = [
    { label: "Clear", color: "#68B882", weight: 0 },
    { label: "Critical", color: "#E86761", weight: 0 },
    { label: "Attention", color: "#FFEA19", weight: 0 },
    { label: "Service down", color: "#A054A6", weight: 0 },
    { label: "Trouble", color: "#EFAF69", weight: 0 },
  ] as DonutSegment[],
}: {
  value?: number;
  size?: number;
  thickness?: number;
  segments?: DonutSegment[];
}) => {
  const total = segments.reduce((s, seg) => s + (seg.weight ?? 0), 0);

  const stops = (() => {
    if (!total) {
      const slice = 100 / segments.length;
      return segments.map((s, i) => ({
        color: s.color,
        from: i * slice,
        to: (i + 1) * slice,
      }));
    }
    let acc = 0;
    return segments.map((s) => {
      const pct = ((s.weight ?? 0) / total) * 100;
      const from = acc;
      const to = acc + pct;
      acc = to;
      return { color: s.color, from, to };
    });
  })();

  const gradient = stops
    .map((st) => `${st.color} ${st.from}% ${st.to}%`)
    .join(", ");

  return (
    <div className="flex items-center justify-center">
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradient})`,
        }}
      >
        <div
          className="absolute rounded-full grid place-items-center"
          style={{
            inset: thickness,
            background: "#ffffff",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <div className="text-center">
            <div className="text-3xl font-extrabold text-gray-900">{value}</div>
            <div className="text-xs font-semibold text-gray-500">Count</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegendDots = ({
  items,
}: {
  items: { label: string; color: string }[];
}) => (
  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs">
    {items.map((s) => (
      <div key={s.label} className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: s.color }}
        />
        <span className="text-gray-600 font-medium">{s.label}</span>
      </div>
    ))}
  </div>
);

type MemoryRow = { name: string; min: number; avg: number };

const MemoryTable = ({ rows }: { rows: MemoryRow[] }) => (
  <>
    <div className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-4 py-2.5 mb-2">
      <div className="text-[12px] font-semibold text-gray-600">Device Name</div>
      <div className="text-center text-[12px] font-semibold text-gray-600">
        MIN
      </div>
      <div className="text-center text-[12px] font-semibold text-gray-600">
        AVG
      </div>
    </div>
    <ul className="divide-y divide-gray-100">
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-3 items-center py-4">
          <div className="px-1 text-[13px] text-gray-800">{r.name}</div>
          <div className="text-center">
            <span className="text-[15px] font-semibold text-gray-900">
              {r.min}
            </span>
          </div>
          <div className="flex justify-center">
            <ProgressPill value={r.avg} />
          </div>
        </li>
      ))}
    </ul>
  </>
);

const VolumesTable = ({ rows }: { rows: VolumeRow[] }) => (
  <>
    <div className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-4 py-2.5 mb-3">
      <div className="text-[12px] font-semibold text-gray-600">Device Name</div>
      <div className="text-[12px] font-semibold text-gray-600">Volume</div>
      <div className="text-right text-[12px] font-semibold text-gray-600">
        utilization%
      </div>
    </div>

    <div className="divide-y divide-gray-100">
      {rows.map((r) => (
        <div key={r.name} className="grid grid-cols-3 items-center py-4 px-4">
          <div className="text-[11px] text-gray-800">{r.name}</div>
          <div className="text-[13px] text-gray-600">{r.vol}</div>
          <div className="flex justify-end">
            <ProgressPill value={r.util} />
          </div>
        </div>
      ))}
    </div>
  </>
);

const RecentAlarms = ({ items }: { items: AlarmItem[] }) => {
  return (
    <div className="p-4">
      <div className="max-h-[770px] overflow-auto space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex-shrink-0 mt-0.5">
              <Image
                src={item.iconSrc ?? ALARM_ICON}
                alt="Alarm"
                width={16}
                height={16}
                className="opacity-90"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer mb-1 leading-tight">
                {item.title}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default function Page() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [ipAvailability, setIpAvailability] = useState({
    used: 0,
    transient: 0,
    available: 0,
    total: 0,
    usedPct: 0,
    transientPct: 0,
    availablePct: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memRows, setMemRows] = useState<MemRow[]>([]);
  const [memLoading, setMemLoading] = useState(true);
  const [memError, setMemError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setMemLoading(true);
        const res = await fetch(MEM_URL, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = parseMemoryRows(json);
        if (alive) {
          setMemRows(rows);
          setMemError(null);
        }
      } catch (e) {
        if (alive)
          setMemError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (alive) setMemLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const fetchIpData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://nmqhfvs3-8000.inc1.devtunnels.ms/api/dashboard/counts/ip-availability",
          { headers: { accept: "application/json" } }
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const json = await response.json();

        const parsed = parseIpResponse(json);
        setIpAvailability(parsed);
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchIpData();
  }, []);

  const [heat, setHeat] = useState({
    clear: 0,
    critical: 0,
    attention: 0,
    serviceDown: 0,
    trouble: 0,
    total: 0,
  });
  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(HEATMAP_URL, {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        const parsed = parseHeatResponse(json);
        if (alive) setHeat(parsed);
      } catch {
        // silently keep zeros on error
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  const [cpuRows, setCpuRows] = useState<MemoryRow[]>([]);
  const [cpuLoading, setCpuLoading] = useState(true);
  const [cpuError, setCpuError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCpuLoading(true);
        const res = await fetch(CPU_URL, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = parseCpuRows(json);
        if (alive) {
          setCpuRows(rows);
          setCpuError(null);
        }
      } catch (e) {
        if (alive)
          setCpuError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (alive) setCpuLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  const [volRows, setVolRows] = useState<VolumeRow[]>([]);
  const [volLoading, setVolLoading] = useState(true);
  const [volError, setVolError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setVolLoading(true);
        const res = await fetch(VOLS_URL, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = parseVolumeRows(json);
        if (alive) {
          setVolRows(rows);
          setVolError(null);
        }
      } catch (e) {
        if (alive)
          setVolError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (alive) setVolLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  const [ifaceItems, setIfaceItems] = useState<InterfaceItem[]>([]);
  const [ifaceLoading, setIfaceLoading] = useState(true);
  const [ifaceError, setIfaceError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIfaceLoading(true);
        const res = await fetch(IFACES_URL, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = parseInterfaces(json);
        if (alive) {
          setIfaceItems(items);
          setIfaceError(null);
        }
      } catch (e) {
        if (alive)
          setIfaceError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        if (alive) setIfaceLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const [recentAlarms, setRecentAlarms] = useState<AlarmItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setRecentLoading(true);
        const res = await fetch(ALARMS_URL, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = parseRecentAlarms(json);
        if (alive) {
          setRecentAlarms(items);
          setRecentError(null);
        }
      } catch (e) {
        if (alive)
          setRecentError(
            e instanceof Error ? e.message : "Failed to load data"
          );
      } finally {
        if (alive) setRecentLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

const [snapRows, setSnapRows] = useState<SnapshotRow[]>(snapshot);
const [snapError, setSnapError] = useState<string | null>(null);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const res = await fetch(SNAPSHOT_URL, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = parseSnapshotRows(json);
      if (alive) {
        setSnapRows(rows);
        setSnapError(null);
      }
    } catch (e) {
      if (alive) setSnapError(e instanceof Error ? e.message : "Failed to load data");
      console.log(snapError)
  
    }
  })();
  return () => { alive = false; };
}, [snapError]);

  function disabledFutureDates(current: any) {
    return current && current > dayjs().endOf("day");
  }
  const onChange: DatePickerProps["onChange"] = (_d, dateString) => {
    if (typeof dateString === "string") {
      setDate(dayjs(dateString, "DD-MM-YYYY").format("YYYY-MM-DD"));
      console.log(date, "test");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <DatePicker
            format={"DD-MM-YYYY"}
            defaultValue={dayjs(dayjs(), "YYYY-MM-DD")}
            onChange={onChange}
            disabledDate={disabledFutureDates}
            allowClear={false}
          />
        </div>
      </div>


      <div className="px-6 pb-10">
      
        <div className="grid grid-cols-1 xl:grid-cols-5 xl:grid-rows-2 gap-4">
         
          <Card
            title="HEAT MAP"
            className="xl:col-start-1 xl:row-start-1 h-[400px]"
          >
            <div className="mt-5">
              <Donut
                size={208}
                thickness={30}
                value={
                  heat.clear +
                  heat.critical +
                  heat.attention +
                  heat.serviceDown +
                  heat.trouble
                } 
                segments={[
                  { label: "Clear", color: "#68B882", weight: heat.clear },
                  {
                    label: "Critical",
                    color: "#E86761",
                    weight: heat.critical,
                  },
                  {
                    label: "Attention",
                    color: "#FFEA19",
                    weight: heat.attention,
                  },
                  {
                    label: "Service down",
                    color: "#A054A6",
                    weight: heat.serviceDown,
                  },
                  { label: "Trouble", color: "#EFAF69", weight: heat.trouble },
                ]}
              />

              <LegendDots
                items={[
                  { label: "Clear", color: "#68B882" },
                  { label: "Critical", color: "#E86761" },
                  { label: "Attention", color: "#FFEA19" },
                  { label: "Service down", color: "#A054A6" },
                  { label: "Trouble", color: "#EFAF69" },
                ]}
              />
            </div>
          </Card>
          <Card
            title="DEVICES BY MEMORY UTILIZATION"
            headerClassName="none"
            className="xl:col-start-1 xl:row-start-2 h-[400px] overflow-y-auto"
          >
            {memLoading ? (
              <MemoryTableSkeleton />
            ) : memError ? (
              <div className="px-4 py-6 text-sm text-red-600">
                Error: {memError}
              </div>
            ) : (
              <MemoryTable rows={memRows} />
            )}
          </Card>

          {/* Col 2 → row 1 & 2 */}
          <Card
            title="IP AVAILABILITY SUMMARY"
            className="xl:col-start-2 xl:row-start-1 h-[400px]"
          >
            <div className="p-6 mt-10">
              {loading && <div className="text-center">Loading...</div>}
              {error && (
                <div className="text-center text-red-500">Error: {error}</div>
              )}
              {!loading && !error && (
                <div className="grid grid-cols-[1fr_auto] items-center gap-6">
                  {/* left: KPI numbers */}
                  <div className="flex flex-col justify-center gap-6">
                    <KpiRow
                      value={ipAvailability.transient}
                      label="Transient"
                      color="#EFAF69"
                    />
                    <KpiRow
                      value={ipAvailability.available}
                      label="Available"
                      color="#68B882"
                    />
                    <KpiRow
                      value={ipAvailability.used}
                      label="Used"
                      color="#E86761"
                    />
                  </div>

              
                  <div className="flex items-center justify-center shrink-0 min-w-[150px]">
                    <IpPillBars
                      used={ipAvailability.usedPct}
                      transient={ipAvailability.transientPct}
                      available={ipAvailability.availablePct}
                      trackHeight={180}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
          <Card
            title="INTERFACES AND ERRORS"
            className="xl:col-start-2 xl:row-start-2"
          >
            {ifaceLoading ? (
              <InterfacesSkeleton />
            ) : ifaceError ? (
              <div className="px-4 py-6 text-sm text-red-600">
                Error: {ifaceError}
              </div>
            ) : (
              <InterfacesErrorsList items={ifaceItems} />
            )}
          </Card>

          {/* Col 4 → single card spanning 2 rows */}
          <Card
            title="INFRASTRUCTURE SNAPSHOT"
            className="xl:col-start-3 xl:row-span-2"
          >
            <SnapshotTable rows={snapRows} />
          </Card>

          {/* Col 3 → row 1 & 2 */}
          <Card
            title="VOLUMES WITH MOST DISK USAGE"
            className="xl:col-start-4 xl:row-start-1 h-[400px] overflow-y-auto"
          >
            {volLoading ? (
              <VolumesTableSkeleton />
            ) : volError ? (
              <div className="px-4 py-6 text-sm text-red-600">
                Error: {volError}
              </div>
            ) : (
              <VolumesTable rows={volRows} />
            )}
          </Card>

          <Card
            title="DEVICES BY CPU UTILIZATION"
            className="xl:col-start-4 xl:row-start-2 h-[400px] overflow-y-auto"
          >
            {cpuLoading ? (
              <MemoryTableSkeleton />
            ) : cpuError ? (
              <div className="px-4 py-6 text-sm text-red-600">
                Error: {cpuError}
              </div>
            ) : (
              <MemoryTable rows={cpuRows} />
            )}
          </Card>

          {/* Col 5 → single card spanning 2 rows */}
          <Card title="RECENT ALARMS" className="xl:col-start-5 xl:row-span-2">
            {recentLoading ? (
              <RecentAlarmsSkeleton />
            ) : recentError ? (
              <div className="px-4 py-6 text-sm text-red-600">
                Error: {recentError}
              </div>
            ) : (
              <RecentAlarms items={recentAlarms} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
