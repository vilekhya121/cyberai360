"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import SkeletonLoader from "../loaders/SkeletonLoader";

interface DynamicData {
  numericGrade: number;
  displayGrade: string;
  time: string;
  count?: number;
  [key: string]: unknown; 
}


interface BarChartComponentProps {
  data: unknown[];
  height?: number | string;
  color?: string;
  datakey: string;
  status: string;
  msg: (message: string) => void;
  colors?: string[];
  showCustomAxis?: boolean;
  restrictKey?: string;
}



const GradeChart = ({
  data,
  status,
  datakey,
  height,
  showCustomAxis,
  restrictKey,
}: BarChartComponentProps) => {
  const keys = data && Object.keys(data[0] as unknown as object);
  const keysData =
    keys && keys.filter((key) => key !== datakey && key !== restrictKey);

  if (status == "connecting") {
    return <SkeletonLoader />;
  }

  // console.log(keysData)

  if (showCustomAxis) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={datakey}  />
          <YAxis
            domain={[5, 0]}
            tick={{ fontSize: 12, dx: -15, textAnchor: "start" }}
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
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart width={500} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={datakey} />
        <YAxis
          domain={[5, 0]}
          ticks={(data as unknown as DynamicData[]).map((item) => item.numericGrade)}
          tickFormatter={(value) => {
            const matchedItem = (data as DynamicData[]).find(
              (item: DynamicData) => item.numericGrade === value
            );
            return matchedItem ? matchedItem.displayGrade : value;
          }}
          tick={{ fontSize: 12, dx: -15, textAnchor: "start" }}
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

export default GradeChart;
