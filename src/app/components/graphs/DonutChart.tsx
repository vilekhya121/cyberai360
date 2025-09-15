"use client";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./Donut.css";

interface DonutData {
  name: string;
  value: number;
}

interface LegendItem {
  label: string;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  legends: LegendItem[];
  totalValue: number;
  centerLabel?: string;
  showLegend?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  legends,
  totalValue,
  centerLabel = "Threats",
  showLegend = true,
}) => {
  // const legendGradientClasses = [
  //   "bg-grad-low", // Low
  //   "bg-grad-medium", // Medium
  //   "bg-grad-high", // High
  // ];

  return (
    <div className="w-full relative flex flex-col">
      <div className="w-full aspect-square relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="50%" 
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              cornerRadius={5} 
            >
             {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={legends[index]?.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xl font-medium text-[#3F434A]">
            {centerLabel}
          </p>
          <p className="text-[11px] text-[#8A9099]">{totalValue}</p>
        </div>
      </div>

      {showLegend && (
        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: legends[index]?.color }}
              />
              <span className="text-xs font-normal text-[#838383]">
                {legends[index].label}{" "}
                <span className="font-medium text-[16px] text-[#838383]">
                  {item.value}%
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;