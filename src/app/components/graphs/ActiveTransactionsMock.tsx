/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type XYLabel = { label: string; value: number };
type XYTime = { time: string; value: number };

type Props = {
  height?: number;
 
  data?: XYLabel[] | XYTime[];
};

const MOCK: XYTime[] = [
  { time: "11:00", value: 280 },
  { time: "11:10", value: 200 },
  { time: "11:20", value: 160 },
  { time: "11:30", value: 480 },
  { time: "11:40", value: 560 },
  { time: "11:50", value: 420 },
  { time: "12:00", value: 140 },
  { time: "12:10", value: 120 },
  { time: "12:20", value: 150 },
  { time: "12:30", value: 300 },
  { time: "12:40", value: 230 },
  { time: "12:50", value: 120 },
];


function normalizeData(rows?: (XYLabel | XYTime)[]): XYTime[] {
  if (!rows?.length) return MOCK;
  return rows.map((r: any) => ({
    time: (r.time ?? r.label) as string,
    value: Number.isFinite(Number(r.value)) ? Number(r.value) : 0,
  }));
}

export default function ActiveTransactionsMock({ height = 200, data }: Props) {
  const rows = normalizeData(data);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="activeTxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8427" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FF8427" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="time" tickMargin={6} stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" width={28} />
          <Tooltip
            formatter={(v: number) => [v, "Active Txns"]}
            labelStyle={{ color: "#6B7280" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FF8427"
            strokeWidth={2.5}
            fill="url(#activeTxGradient)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
