"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Props = {
  data: Record<string, unknown>[];
  datakey: string;           
  keys: string[];           
  colors: string[];          
  labels?: string[];       
  height?: number;
  radius?: number;          
  roundedTop?: boolean;     
  barSize?: number;
  barCategoryGap?: number | string;
  yMax?: number;
  showLegend?: boolean;      
};
type RoundedTopBarProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
};
/** Curved (pill-like) top cap */
function RoundedTopBar(props: RoundedTopBarProps) {
  const { x, y, width, height, fill } = props;
  const r = Math.min(props.radius ?? 12, width / 2, Math.max(0, height));
  if (height <= r) {
    return (
      <path
        d={`M${x},${y + height}
           L${x},${y + r}
           Q${x},${y} ${x + r},${y}
           L${x + width - r},${y}
           Q${x + width},${y} ${x + width},${y + r}
           L${x + width},${y + height}
           Z`}
        fill={fill}
      />
    );
  }
  const path = `
    M ${x},${y + r}
    Q ${x},${y} ${x + r},${y}
    L ${x + width - r},${y}
    Q ${x + width},${y} ${x + width},${y + r}
    L ${x + width},${y + height}
    L ${x},${y + height}
    Z
  `;
  return <path d={path} fill={fill} />;
}

export default function StackedBarChartComponent({
  data,
  datakey,
  keys,
  colors,
  labels,
  height = 250,
  radius = 14,
  roundedTop = true,
  barSize = 36,
  barCategoryGap = "32%",
  yMax,
  showLegend = true,
}: Props) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          barCategoryGap={barCategoryGap}
        >
          <CartesianGrid stroke="#E6E9F4" vertical={false} />
          <XAxis dataKey={datakey} tickMargin={6} stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" domain={yMax ? [0, yMax] : ["auto", "auto"]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />

          {keys.map((k, i) => {
            const isTop = i === keys.length - 1;
            return (
              <Bar
                key={k}
                dataKey={k}
                stackId="a"
                fill={colors[i] ?? "#8884d8"}
                barSize={barSize}
                stroke="#FFFFFF"
                strokeOpacity={0.6}
                strokeWidth={1}
                shape={
                  roundedTop && isTop
                    ? (props: unknown) => <RoundedTopBar {...(props as RoundedTopBarProps)} radius={radius} />
                    : undefined
                }
                radius={roundedTop && isTop ? 0 : [4, 4, 0, 0]}
                isAnimationActive={false}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend under the graph */}
      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {keys.map((k, i) => (
            <div key={k} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="text-xs text-gray-700">
                {(labels && labels[i]) || k}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
