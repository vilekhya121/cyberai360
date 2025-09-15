// app/components/HeatMapDonut.tsx
"use client";

import Card from "./Card";
import { heatMap } from "../../data/mock";

export default function HeatMapDonut() {
  const total = heatMap.slices.reduce((a, b) => a + b.value, 0);
  let acc = 0;
  const stops = heatMap.slices
    .map((s) => {
      const from = (acc / total) * 100;
      acc += s.value;
      const to = (acc / total) * 100;
      return `${s.color} ${from.toFixed(2)}% ${to.toFixed(2)}%`;
    })
    .join(", ");

  return (
    <Card title="HEAT MAP">
      <div className="flex items-center gap-6">
        {/* donut via conic-gradient */}
        <div className="relative h-40 w-40">
          <div
            className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${stops})` }}
          />
          <div className="absolute inset-4 bg-white rounded-full grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">
                {heatMap.total}
              </div>
              <div className="text-xs text-gray-500">Count</div>
            </div>
          </div>
        </div>

        {/* legend */}
        <div className="grid grid-cols-2 gap-2">
          {heatMap.slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="text-xs text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
