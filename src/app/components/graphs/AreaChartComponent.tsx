import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface AreaChartComponentProps {
  data: unknown[];
  height?: number | string;
  color?: string;
  datakey: string;
  status: string;
  msg: (message: string) => void;
  fill?: number;
  stroke?: number;
  graphColors?: string[];
  renderAxes?: () => React.ReactNode;
  showCustomAxis?: boolean;
  gradientFills?: Record<string, string>;
  topOpacity?: number;
  gradientsByKey?: Record<string, { from: string; to?: string }>;
}

const AreaChartComponent = ({
  height,
  data,
  datakey = "hour",
  status,
  color,
  stroke,
  renderAxes,
  showCustomAxis,
  graphColors = [],
  // gradientFills,
  topOpacity = 0.2,
  gradientsByKey,
}: AreaChartComponentProps) => {
  const keys =
    Array.isArray(data) && data.length > 0
      ? Object.keys(data[0] as Record<string, unknown>)
      : [];

  const filteredKeys = keys?.filter((item) => item !== datakey);
  const uid = React.useMemo(() => Math.random().toString(36).slice(2), []);
  if (status == "connecting") {
    return <SkeletonLoader />;
  }
  return (
    <ResponsiveContainer width="100%" height={height ? height : "100%"}>
      <AreaChart data={data}>
      <defs>
          
          {filteredKeys.map((k) => {
            const g = gradientsByKey?.[k];
            const from = g?.from;
            const to = g?.to ?? "rgba(255,255,255,0)";
            if (!from) return null;
            return (
              <linearGradient id={`grad-${uid}-${k}`} x1="0" y1="0" x2="0" y2="1" key={k}>
                <stop offset="0%" stopColor={from} />
                <stop offset="100%" stopColor={to} />
              </linearGradient>
            );
          })}
          
          {!gradientsByKey && (
            <linearGradient id={`generic-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopOpacity={Math.min(1, Math.max(0, topOpacity))} />
              <stop offset="100%" stopOpacity={0} />
            </linearGradient>
          )}
        </defs>

        {showCustomAxis && renderAxes ? (
          renderAxes()
        ) : (
          <>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={datakey} />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => {
                const capitalized =
                  name.charAt(0).toUpperCase() + name.slice(1);
                return [value, capitalized];
              }}
            />
          </>
        )}
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={datakey} />
        <YAxis />
        <Tooltip
          formatter={(value: number, name: string) => {
            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
            return [value, capitalized];
          }}
        />
        {/* <Legend
          layout="horizontal"
          verticalAlign="top"
          align="right"
          wrapperStyle={{ paddingBottom: "10px", paddingTop: "10px" }}
        /> */}
       {filteredKeys.map((k, i) => {
          const strokeColor = graphColors?.[i] ?? color;
          const fillUrl = gradientsByKey
            ? `url(#grad-${uid}-${k})`
            : `url(#generic-${uid})`;
          return (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={strokeColor}
              fill={fillUrl}
              strokeWidth={stroke}
              dot={false}
              activeDot={{ r: 6 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartComponent;
