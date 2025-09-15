/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import SemiGauge from "@/app/components/graphs/SemiGauge";

type Props = {
  /** e.g., 48.68 from /latest-metrics */
  cpuUsage?: number;
  /** e.g., 37.37 from /latest-metrics */
  memoryUsage?: number;
};

type RUItem = {
  title: string;
  value: number; // 0..100
};

const MOCK_DATA: RUItem[] = [
  { title: "CPU Utilization", value: 60 },
  { title: "RAM Usage", value: 29 },
];

function clampPercent(n: number | undefined): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(100, n));
}

export default function ResourceUtilizationMock({ cpuUsage, memoryUsage }: Props) {
  // Use props if provided; otherwise keep original mock values.
  const cpu = clampPercent(cpuUsage);
  const mem = clampPercent(memoryUsage);

  const data: RUItem[] = [
    { title: "CPU Utilization", value: Math.round(cpu ?? MOCK_DATA[0].value) },
    { title: "RAM Usage", value: Math.round(mem ?? MOCK_DATA[1].value) },
  ];

  return (
    <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200">
      <div className="border-b-2 border-gray-200 p-2">
        <h4 className="font-semibold text-base">RESOURCE UTILIZATION</h4>
      </div>

      <div className="divide-y divide-gray-200">
        {data.map((item) => (
          <div key={item.title} className="p-3">
            <h5 className="font-semibold text-sm mb-1">{item.title}</h5>

            <div className="flex flex-col items-center">
              <SemiGauge
                value={item.value}
                size={230}
                thickness={18}
                linearGradient
                overlayOpacity={0.4}
                className="w-full max-w-[210px] mx-auto"
                // keep segments identical
                segments={[
                  { to: 60, color: "#22C55E" }, // green
                  { to: 85, color: "#FACC15" }, // yellow
                  { to: 95, color: "#F59E0B" }, // orange
                  { to: 100, color: "#FFE4E6" }, // light pink
                ]}
                needleColor="#3B1AA2"
                trackColor="#F1F5F9"
                showTicks
              />

              <div className="text-3xl font-bold text-gray-700">
                {item.value}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
