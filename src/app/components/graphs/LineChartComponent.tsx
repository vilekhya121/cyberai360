import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface LineChartComponentProps {
  data: unknown[];
  height?: number | string;
  color?: string;
  datakey: string;
  status: string;
  msg: (message: string) => void;
  fill?: number;
  stroke?: number;
  graphColors?: string[];
}

const LineChartComponent = ({
  height,
  data,
  datakey = "label",
  status,
  color,
  stroke,
  graphColors = [],
}: LineChartComponentProps) => {
  const keys =
  Array.isArray(data) && data.length > 0
    ? Object.keys((data[0] as Record<string, unknown>))
    : [];

    const typedData = data as Record<string, unknown>[];

    const filteredKeys = keys?.filter((item) => {
      return item !== datakey && typeof typedData[0][item] === "number";
    });
    
    
  if (status == "connecting") {
    return <SkeletonLoader />;
  }
  // console.log("LineChart Data:", data);
  // console.log("Filtered Keys:", filteredKeys);
  
  return (
    <ResponsiveContainer width="100%" height={height ? height : "100%"}>
      <LineChart data={data}>
        <XAxis dataKey={datakey} />
        <YAxis axisLine={false} />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip
          formatter={(value: number, name: string) => {
            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
            return [value, capitalized];
          }}
        />
       {(filteredKeys?.length > 0 ? filteredKeys : ["score"]).map((item, index) => (
          <Line
            key={index}
            type="monotone"
            dataKey={item}
            stroke={graphColors?.length > 0 ? graphColors[index] : color}
            fill={`url(#color${color})`}
            strokeWidth={stroke}
            dot={false}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
