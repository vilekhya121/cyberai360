// app/components/InfraSnapshot.tsx
import Card from "./Card";
import { infraSnapshot } from "../../data/mock";

export default function InfraSnapshot() {
  return (
    <Card title="INFRASTRUCTURE SNAPSHOT">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="py-2 px-2 text-left font-medium">Name</th>
              <th className="py-2 px-2 text-left font-medium">Alarms</th>
              <th className="py-2 px-2 text-left font-medium">Devices</th>
              <th className="py-2 px-2 text-left font-medium">
                Problematic Devices
              </th>
            </tr>
          </thead>
          <tbody>
            {infraSnapshot.map((r) => (
              <tr key={r.name} className="border-t border-gray-100">
                <td className="py-2 px-2">{r.name}</td>
                <td className="py-2 px-2">{r.alarms}</td>
                <td className="py-2 px-2">{r.devices}</td>
                <td className="py-2 px-2">{r.problematic}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
