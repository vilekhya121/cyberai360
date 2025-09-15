import React from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  XAxis,
} from "recharts";

interface SynchronizedAreaChartComponentProps {
  color: string;
  data: unknown[];
  datakey?: string;
  status: string;
  msg: (message: string) => void;
}

const SynchronizedAreaChartComponent = ({
  color,
  data,
  datakey,
}: SynchronizedAreaChartComponentProps) => {
  const keys = data && Object.keys(data[0] as object);
  const filteredKeys = keys?.filter((item) => item !== datakey);

  return (
    <ResponsiveContainer width={"100%"} height={200}>
      <AreaChart data={data} syncId="anyId">
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"  
          minTickGap={20}  
          tickLine={false}
          axisLine={false}
        />
        <YAxis axisLine={false} dataKey={datakey} />
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <defs>
          <linearGradient id={`color${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <Tooltip
          formatter={(value: number, name: string) => {
            const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
            return [value, capitalized];
          }}
        />
        {filteredKeys?.map((item, index) => (
          <Area
            type="monotone"
            dataKey={item}
            key={index}
            stroke={color}
            fill={`url(#color${color})`}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 8 }}
            stackId={index}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default SynchronizedAreaChartComponent;
