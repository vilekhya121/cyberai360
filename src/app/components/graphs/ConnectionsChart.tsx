"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type ConnPoint = { time: string; active: number; aborted: number };

type Props = {
  data?: ConnPoint[];

  height?: number;
};

function buildConnectionsMock(): ConnPoint[] {
  return [
    { time: "10:30", active: 62, aborted: 32 },
    { time: "11:00", active: 66, aborted: 25 },
    { time: "11:30", active: 80, aborted: 38 },
    { time: "12:00", active: 74, aborted: 24 },
    { time: "12:30", active: 70, aborted: 22 },
  ];
}

type TooltipPayloadItem = {
  dataKey: keyof ConnPoint;
  value: number;
};

type ConnectionsTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

const ConnectionsTooltip = ({
  active,
  payload,
  label,
}: ConnectionsTooltipProps) => {
  if (!active || !payload?.length) return null;

  // values keyed by dataKey
  const byKey = payload.reduce(
    (acc: Record<keyof ConnPoint, number>, p: TooltipPayloadItem) => ({
      ...acc,
      [p.dataKey]: p.value,
    }),
    {} as Record<keyof ConnPoint, number>
  );

  const dateStr = `March 8, 2024, ${label}:34`;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "12px 16px",
          border: "1px solid #EEF2F7",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          minWidth: 220,
        }}
      >
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
          {dateStr}
        </div>

        <div style={{ fontSize: 14 }}>
          <span style={{ color: "#111827", fontWeight: 600 }}>Active:</span>{" "}
          <span style={{ color: "#5B93FF", fontWeight: 800 }}>
            {byKey.active}
          </span>{" "}
          <span style={{ color: "#111827", fontWeight: 600, marginLeft: 8 }}>
            Aborted:
          </span>{" "}
          <span style={{ color: "#FF8427", fontWeight: 800 }}>
            {byKey.aborted}
          </span>
        </div>

        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
          Network Traffic
        </div>
      </div>

      {/* little speech-bubble notch */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 14,
          height: 14,
          background: "#fff",
          bottom: -7,
          borderLeft: "1px solid #EEF2F7",
          borderBottom: "1px solid #EEF2F7",
          boxShadow: "2px 2px 6px rgba(0,0,0,0.05)",
        }}
      />
    </div>
  );
};

/* ---------------- Main component ---------------- */
export default function ConnectionsChart({ data, height = 242 }: Props) {
  const series = useMemo(() => data ?? buildConnectionsMock(), [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={series}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis
          dataKey="time"
          tick={{ fontSize: 12, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          tick={{ fontSize: 12, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          domain={[0, 110]}
        />

        <Tooltip
          content={<ConnectionsTooltip />}
          cursor={{ strokeDasharray: "4 3", stroke: "#9CA3AF" }}
        />

        <Legend
          verticalAlign="top"
          align="right"
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />

        <Line
          type="monotone"
          dataKey="active"
          name="Active"
          stroke="#5B93FF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />

        <Line
          type="monotone"
          dataKey="aborted"
          name="Aborted"
          stroke="#FF8427"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
