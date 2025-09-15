import React from "react";
import dynamic from "next/dynamic";
import BarChartComponent from "./BarChartComponent";
import GradeChart from "./GradeChart";
import StackedBarChartComponent from "./StackedBarChartComponent";

const AreaChart = dynamic(
  () => import("@/app/components/graphs/AreaChartComponent"),
  {
    ssr: false,
  }
);

const ScatterChart = dynamic(
  () => import("@/app/components/graphs/ScatterChartComponent"),
  {
    ssr: false,
  }
);

const LineChart = dynamic(
  () => import("@/app/components/graphs/LineChartComponent"),
  {
    ssr: false,
  }
);

function GenericChart({
  chartType,
  data,
  datakey,
  status,
  color,
  fill,
  stroke,
  graphColors,
  height,
  msg,
  type,
  showCustomAxis,
  restrictKey,
  gradientFills,
  gradientsByKey
  
}: {
  chartType: string;
  data: unknown[];
  datakey: string;
  status: string;
  color?: string;
  fill?: number;
  stroke?: number;
  graphColors?: string[];
  height: number;
  msg: (message: string) => void;
  type?: string;
  showCustomAxis?: boolean;
  restrictKey?: string;
  gradientFills?: Record<string, string>;
  gradientsByKey?: Record<string, { from: string; to?: string }>;
}) {

  // console.log(data,"data")
  const renderChart = () => {
    switch (chartType) {
      case "area":
        return (
          <AreaChart
            height={height}
            msg={msg}
            data={data}
            datakey={datakey}
            status={status}
            color={color}
            fill={fill}
            stroke={stroke}
            graphColors={graphColors}
            gradientFills = {gradientFills}
            gradientsByKey={gradientsByKey}
          />
        );
      case "line":
        return (
          <LineChart
            height={height}
            msg={msg}
            data={data}
            datakey={datakey}
            status={status}
            color={color}
            fill={fill}
            stroke={stroke}
            graphColors={graphColors}
          />
        );
      case "scatter":
        return (
          <ScatterChart
            status={status}
            msg={msg}
            data={data}
            height={height}
            dataKey={datakey}
            color={color || "#F79009"}
            type={type || ""}
          />
        );
      case "bar":
        return (
          <BarChartComponent
            datakey={datakey}
            data={data}
            status={status}
            msg={msg}
            height={height}
            showCustomAxis={showCustomAxis}
            // renderAxes={renderAxes}
          />
        );
      case "gradeBar":
        return (
          <GradeChart
            datakey={datakey}
            data={data}
            status={status}
            msg={msg}
            height={height}
            showCustomAxis={showCustomAxis}
            restrictKey={restrictKey}
            // renderAxes={renderAxes}
          />
        );
        case "stackedbar":
          return(
            <StackedBarChartComponent
            datakey={datakey}
            data={data}
            status={status}
            msg={msg}
            height={height}
            showCustomAxis={showCustomAxis}
            restrictKey={restrictKey}
            />
          )
    }
  };

  return <div>{renderChart()}</div>;
}

export default GenericChart;
