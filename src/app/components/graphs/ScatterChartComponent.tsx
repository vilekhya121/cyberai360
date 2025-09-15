/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface renderSquareProps {
  cx: number;
  cy: number;
  size: number;
  color?: string;
  opacity?: number;
}

// interface payloadProps {
//   value: number;
// }

// interface customYAxisTickProps {
//   x: number;
//   y: number;
//   payload: payloadProps;
// }

interface RiskLevelChartProps {
  data: unknown[];
  type?: string;
  dataKey?: string;
  status: string;
  msg: (message: string) => void;
  color?: string;
  height?: number;
}

const renderSquare = (props: renderSquareProps) => {
  const { cx, cy, size, color } = props;
  return (
    <rect
      x={cx - size / 3}
      y={cy - size / 2}
      width={10}
      height={10}
      fill={color}
    />
  );
};

const renderBubble = (props: renderSquareProps) => {
  const { cx, cy, size, color, opacity } = props;
  return (
    <>
      {color === "#ED807880" ? (
        <circle
          cx={cx}
          cy={cy}
          r={size / 2}
          fill={color}
          fillOpacity={opacity}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={size / 3}
          fill={color}
          fillOpacity={opacity}
        />
      )}
    </>
  );
};

// const CustomYAxisTick = ({ x, y, payload }: customYAxisTickProps) => {
//   const labelMap = {
//     100: "1",
//     200: "2",
//     300: "3",
//     400: "4",
//   };

//   return (
//     <text x={x - 10} y={y + 5} textAnchor="end" fill="#666">
//       {labelMap[payload.value as keyof typeof labelMap]}
//     </text>
//   );
// };

function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const assignColorsAndOpacitiesToData = (data: any[]) => {
  if (!data || data.length === 0) {
    return [];
  }
  return data.map((item, index) => ({
    ...item,
    color: shuffledColors[index % shuffledColors.length],
  }));
};

const colors = ["#ED807880", "#FAB55A80", "#FFDD5480"];
const shuffledColors = shuffleArray([...colors]);

const RiskLevelChart = ({
  data,
  type,
  dataKey = "time",
  status,
  color,
  height,
}: RiskLevelChartProps) => {
  const keys =
  Array.isArray(data) && data.length > 0
    ? Object.keys((data[0] as Record<string, unknown>))
    : [];

    const typedData = data as Record<string, unknown>[];

    const filteredKeys = keys.filter((key) => {
      if (key === dataKey) return false;
      return typedData.some(item => typeof item[key] === "number");
    });
    
    
  const coloredData = useMemo(
    () => assignColorsAndOpacitiesToData(data),
    [data]
  );

  if (status == "connecting") {
    return <SkeletonLoader />;
  }
  // console.log("ScatterChart data:", data);
  // console.log("Filtered Keys for Scatter:", filteredKeys);
  return (
    <ResponsiveContainer width={"100%"} height={height}>
      <ScatterChart>
        <CartesianGrid vertical={true} />
        <XAxis type="category" dataKey={dataKey}  />
        {filteredKeys?.map((item, index) => (
          <YAxis
            axisLine={false}
            key={index}
            type="number"
            dataKey={item}
            name={item}
            allowDecimals={false}
          />
        ))}
        <Tooltip
  cursor={{ strokeDasharray: "3 3" }}
  formatter={(value: number, name: string) => {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return [value, capitalized];
  }}
/>

        {type == "bubble" ? (
          <Scatter
            name="Risk Levels"
            data={coloredData}
            // fill="#ccc"           
            shape={(props: any) =>
              renderBubble({
                cx: props.cx,
                cy: props.cy,
                size: props.size,
                color: props.payload.color,
                opacity: props.payload.opacity,
              })
            }
          />
        ) : (
          <Scatter
            name="Risk Levels"
            data={coloredData}
            fill={color}
            shape={(props: unknown) => renderSquare(props as renderSquareProps)}
          />
        )}
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default RiskLevelChart;
