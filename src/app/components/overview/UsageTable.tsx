// app/components/UsageTable.tsx
import Card from "./Card";
import type { UsageRow } from "../../data/mock";

function Badge({ value }: { value: number }) {
  // color thresholds similar to screenshot
  const color =
    value >= 85
      ? "bg-rose-100 text-rose-600"
      : value >= 70
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{value}</span>
  );
}

export default function UsageTable({
  title,
  rows,
}: {
  title: string;
  rows: UsageRow[];
}) {
  return (
    <Card title={title}>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 px-2 text-left font-medium">Device Name</th>
              <th className="py-2 px-2 text-left font-medium">MIN</th>
              <th className="py-2 px-2 text-left font-medium">AVG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.deviceName} className="border-t border-gray-100">
                <td className="py-2 px-2">{r.deviceName}</td>
                <td className="py-2 px-2">{r.min}</td>
                <td className="py-2 px-2">
                  <Badge value={r.avg} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
