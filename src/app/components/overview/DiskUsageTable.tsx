// app/components/DiskUsageTable.tsx
import Card from "./Card";
import type { DiskRow } from "../../data/mock";

function UtilBadge({ v }: { v: number }) {
  const color =
    v >= 85
      ? "bg-rose-100 text-rose-600"
      : v >= 70
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  return <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{v}</span>;
}

export default function DiskUsageTable({
  title,
  rows,
}: {
  title: string;
  rows: DiskRow[];
}) {
  return (
    <Card title={title}>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 px-2 text-left font-medium">Device Name</th>
              <th className="py-2 px-2 text-left font-medium">Volume</th>
              <th className="py-2 px-2 text-left font-medium">utilization%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.deviceName} className="border-t border-gray-100">
                <td className="py-2 px-2">{r.deviceName}</td>
                <td className="py-2 px-2">{r.volume}</td>
                <td className="py-2 px-2">
                  <UtilBadge v={r.utilization} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
