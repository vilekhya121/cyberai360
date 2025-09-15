/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import dayjs from "dayjs";

type Props = {
  height?: number;

  data?: Array<Record<string, any>>;
};


const base = [
  ["11:00", 0, 22], ["11:04", 0, 25], ["11:06", 0.2, 28], ["11:08", 0.2, 31],
  ["11:10", 0.4, 34], ["11:12", 0.4, 38], ["11:14", 0.6, 41], ["11:16", 0.8, 45],
  ["11:18", 0.8, 49], ["11:20", 1.0, 52], ["11:22", 1.0, 56], ["11:24", 1.2, 60],
  ["11:26", 1.4, 63], ["11:28", 1.6, 66], ["11:30", 1.6, 68], ["11:32", 1.8, 70],
  ["11:34", 2.0, 72], ["11:36", 2.0, 74], ["11:38", 2.2, 76], ["11:40", 2.2, 78],
  ["11:42", 2.4, 80], ["11:44", 2.4, 82], ["11:46", 2.6, 83], ["11:48", 2.6, 85],
  ["11:50", 2.8, 86], ["11:52", 2.8, 87], ["11:54", 2.8, 88], ["11:56", 3.0, 89],
  ["11:58", 3.0, 90], ["12:00", 3.0, 91], ["12:10", 2.6, 84], ["12:20", 2.8, 86],
  ["12:30", 3.0, 90], ["12:40", 2.6, 83],
];

const MOCK = base.map(([time, level, occ]) => ({
  time: time as string,
  level: level as number,               // y-axis (0..3)
  occupancy: occ as number,            // %
  alert: (occ as number) >= 75 ? "DeadLock Alert" : undefined,
  fullTimestamp: `March 8, 2024, ${time}:${Math.floor(Math.random() * 59)
    .toString()
    .padStart(2, "0")}`,
}));

type LocksTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: {
      occupancy: number;
      alert?: string;
      fullTimestamp: string;
    };
  }>;
};

function LocksTooltip({ active, payload }: LocksTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const percent = `${p.occupancy}% occupied`;
  const isAlert = !!p.alert;

  return (
    <div className="relative">
      <div className="rounded-2xl bg-white shadow-xl border border-gray-200 px-4 py-3 min-w-[220px]">
        <div className="text-xs text-gray-400">{p.fullTimestamp}</div>
        <div className="mt-1 text-lg font-semibold text-[#F79009]">
          {percent} <span className="align-middle text-sm font-medium text-gray-500">occupied</span>
        </div>
        {isAlert && (
          <div className="mt-1 text-sm font-medium text-gray-700">DeadLock Alert</div>
        )}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2"
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "8px solid white",
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
        }}
      />
    </div>
  );
}


function normalize(rows?: Array<Record<string, any>>) {
  if (!rows?.length) return MOCK;

  return rows.map((r) => {
    // TIME
    const time: string =
      r.time ??
      r.label ??
      (r.timestamp ? dayjs(r.timestamp).format("HH:mm") : "00:00");

    // LEVEL (0..3)
    let level: number | undefined =
      (typeof r.level === "number" ? r.level : undefined) ??
      (typeof r.y === "number" ? r.y : undefined) ??
      (typeof r.value === "number" ? r.value : undefined);

   
    let occupancy: number | undefined =
      (typeof r.occupancy === "number" ? r.occupancy : undefined);

    if (level == null && occupancy != null) {
      level = Math.max(0, Math.min(3, (occupancy / 100) * 3));
    }

    if (level == null) level = 0;
    if (level > 3) {
  
      level = Math.max(0, Math.min(3, Math.log10(level + 1)));
    }

    // OCCUPANCY (%)
    if (occupancy == null) {

      occupancy = Math.round(Math.max(0, Math.min(100, (level / 3) * 100)));
    } else {
      occupancy = Math.max(0, Math.min(100, Math.round(occupancy)));
    }


    const alert: string | undefined =
      r.alert ?? (occupancy >= 75 ? "DeadLock Alert" : undefined);

    const fullTimestamp: string =
      r.fullTimestamp ??
      (r.timestamp
        ? dayjs(r.timestamp).format("MMMM D, YYYY, HH:mm:ss")
        : // synthesize seconds if only HH:mm
          `March 8, 2024, ${time}:${Math.floor(Math.random() * 59)
            .toString()
            .padStart(2, "0")}`);

    return { time, level, occupancy, alert, fullTimestamp };
  });
}

export default function LocksScatterMock({ height = 200, data }: Props) {
  const rows = normalize(data);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis
            type="category"
            dataKey="time"
            tickMargin={6}
            stroke="#9CA3AF"
            allowDuplicatedCategory={false}
          />
          <YAxis
            type="number"
            dataKey="level"
            domain={[0, 3]}
            tickCount={4}
            stroke="#9CA3AF"
            width={24}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<LocksTooltip />} />
          <Scatter
            data={rows}
            fill="#F79009"
            fillOpacity={0.5}
            shape="square"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
