"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface BarChartComponentProps {
  data: unknown[];
  height?: number | string;
  color?: string;
  datakey: string;
  status: string;
  msg: (message: string) => void;
  colors?: string[];
  renderAxes?: () => React.ReactNode;
  showCustomAxis?: boolean;
}

const BarChartComponent = ({
  data,
  status,
  datakey,
  height,
  renderAxes,
  showCustomAxis,
}: BarChartComponentProps) => {
  const keys =
  Array.isArray(data) && data.length > 0
    ? Object.keys((data[0] as Record<string, unknown>))
    : [];

    const typedData = data as Record<string, unknown>[];

    const keysData = keys?.filter((key) => {
      return (
        key !== datakey &&
        typedData.some((item) => typeof item[key] === "number" && !isNaN(item[key] as number))
      );
    });
    

  if (status == "connecting") {
    return <SkeletonLoader />;
  }
  // console.log("BarChart data:", data);
  // console.log("Filtered Keys for Bar:", keysData);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart width={500} height={300} data={data}>
        {showCustomAxis && renderAxes ? (
          renderAxes()
        ) : (
          <>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={datakey} />
            <YAxis />
                          <Tooltip
              formatter={(value: number, name: string) => {
                const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
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
        {/* <Legend /> */}
        {keysData?.map((entry, index) => (
          <Bar
            dataKey={entry}
            key={index}
            stackId="a"
            fill={"rgba(150, 158, 201, 1)"}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
