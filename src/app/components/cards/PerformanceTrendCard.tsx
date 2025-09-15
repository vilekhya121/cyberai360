"use client";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


const mock = [
  { time: "09:00", active: 54, memory: 12 },
  { time: "09:15", active: 58, memory: 16 },
  { time: "09:30", active: 66, memory: 19 },
  { time: "09:45", active: 69, memory: 18 },
  { time: "10:00", active: 81, memory: 16 },
  { time: "10:15", active: 82, memory: 14 },
  { time: "10:30", active: 78, memory: 11 },
  { time: "10:45", active: 76, memory: 8 },
  { time: "11:00", active: 85, memory: 5 },
  { time: "11:15", active: 89, memory: 4 },
  { time: "11:30", active: 84, memory: 5 },
  { time: "11:45", active: 73, memory: 9 },
  { time: "12:00", active: 63, memory: 7 },
  { time: "12:15", active: 61, memory: 5 },
  { time: "12:30", active: 66, memory: 3 },
];

const GREEN = "#00A26A";
const ORANGE = "#FF8427";

function avg(series: number[]) {
  if (!series.length) return 0;
  const v = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  return v;
}

export default function PerformanceTrendCard() {
  const [showActive, setShowActive] = useState(true);
  const [showMemory, setShowMemory] = useState(true);

  const activeAvg = useMemo(() => avg(mock.map(d => d.active)), []);
  const memoryAvg = useMemo(() => avg(mock.map(d => d.memory)), []);

  return (
    <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200">
      <div className="px-4 pt-4">
        <h5 className="text-md text-gray-900 font-bold text-left">
          PERFORMANCE TREND OVER TIME
        </h5>
      </div>

      <div className="grid grid-cols-12 gap-0 px-2 pb-4">
        {/* LEFT LEGEND / CONTROLS */}
        <div className="col-span-12 lg:col-span-2 pt-6">
          <div
            className="flex items-start gap-2 cursor-pointer select-none mb-4"
            onClick={() => setShowActive(v => !v)}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full mt-1"
              style={{ background: showActive ? GREEN : "#D1D5DB" }}
            />
            <div className="leading-5">
              <p className="text-sm text-gray-800">Active connection</p>
              <p className="text-xs text-gray-500">
                Avg: <span className="font-semibold">{activeAvg}%</span>
              </p>
            </div>
          </div>

          <div
            className="flex items-start gap-2 cursor-pointer select-none"
            onClick={() => setShowMemory(v => !v)}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full mt-1"
              style={{ background: showMemory ? ORANGE : "#D1D5DB" }}
            />
            <div className="leading-5">
              <p className="text-sm text-gray-800">Memory</p>
              <p className="text-xs text-gray-500">
                Avg: <span className="font-semibold">{memoryAvg}%</span>
              </p>
            </div>
          </div>

     
          <div className="mt-8 flex items-center gap-2 text-gray-500">
            <span className="h-4 w-4 rounded border border-gray-400 bg-gray-100 inline-block" />
            <span className="text-xs">Compare All</span>
          </div>
        </div>

        {/* CHART */}
        <div className="col-span-12 lg:col-span-10">
          <div className="pt-2 pr-2 h-[560px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mock} margin={{ top: 16, right: 12, bottom: 16, left: 0 }}>
                <CartesianGrid
                  stroke="#E5E7EB"
                  strokeDasharray="0"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  ticks={[
                    "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
                  ]}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid #E5E7EB",
                  }}
                />
                {showActive && (
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="Active connection"
                    stroke={GREEN}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {showMemory && (
                  <Line
                    type="monotone"
                    dataKey="memory"
                    name="Memory"
                    stroke={ORANGE}
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
