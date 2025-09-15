import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface payloadProps {
  name: string;
  value: number;
  color: string;
}
interface customTooltipProps {
  active?: boolean;
  payload?: payloadProps[];
  label?: string;
}
interface StackedBarChartProps {
  height?: number | string;
  data: unknown[];
  colors?: string[];
  datakey?: string;
  status: string;
  showCustomAxis?: boolean;
  restrictKey?: string;
  msg: (message: string) => void;
  showLegend?: boolean;
}

const CustomTooltip = ({ active, payload, label }: customTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
        }}
      >
        <p className="label">{`${label} totals`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StackedBarChartComponent = ({
  height,
  data,
  colors = [],
  datakey,
  showCustomAxis,
  restrictKey,
  showLegend,
  status,
}: StackedBarChartProps) => {
  if (status === "connecting") return <SkeletonLoader />;

  const keys =
    Array.isArray(data) && data.length > 0
      ? Object.keys(data[0] as Record<string, unknown>)
      : [];
  const stackKeys =
    keys?.filter((k) => k !== datakey && k !== restrictKey) ?? [];

  const renderStackBars = (keysToUse: string[]) =>
    keysToUse.map((entry, index) => {
      const isTop = index === keysToUse.length - 1;
      return (
        <Bar
          key={entry}
          dataKey={entry}
          stackId="stack"
          fill={colors[index]}
          stroke="none"
          radius={[isTop ? 10 : 0, isTop ? 10 : 0, 0, 0]} // round only the top segment
        />
      );
    });

  if (showCustomAxis) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          width={500}
          height={300}
          data={data as Record<string, unknown>[]}
          barSize={50}
          barGap={0}               // no background pill → no overlap
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={datakey} />
          <YAxis domain={[5, 0]} tick={{ fontSize: 12, dx: -15, textAnchor: "start" }} />
          {showLegend !== false && (
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingBottom: "10px", paddingTop: "10px" }}
            />
          )}
          {renderStackBars(stackKeys)}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height ? height : "100%"}>
      <BarChart
         data={data as Record<string, unknown>[]}
        barSize={50}
        barGap={0}                 // no overlap since pill is removed
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={datakey} />
        <YAxis axisLine={false} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "transparent" }}
          formatter={(value: number, name: string) => {
            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
            return [value, capitalized];
          }}
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingBottom: "10px", paddingTop: "10px" }}
        />

        {renderStackBars(stackKeys)}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default StackedBarChartComponent;
