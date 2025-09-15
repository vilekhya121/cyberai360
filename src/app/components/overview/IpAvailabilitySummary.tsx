// app/components/IpAvailabilitySummary.tsx
import Card from "./Card";
import { ipAvailability } from "../../data/mock";

export default function IpAvailabilitySummary() {
  return (
    <Card title="IP AVAILABILITY SUMMARY">
      <div className="flex items-end gap-6">
        <div className="space-y-2 w-24">
          <div className="text-3xl font-bold text-amber-600">
            {ipAvailability.transient}
          </div>
          <div className="text-xs text-gray-500">Transient</div>

          <div className="text-emerald-600 text-2xl font-bold">
            {ipAvailability.available}
          </div>
          <div className="text-xs text-gray-500">Available</div>

          <div className="text-rose-600 text-2xl font-bold">
            {ipAvailability.used}
          </div>
          <div className="text-xs text-gray-500">Used</div>
        </div>

        {/* bars */}
        <div className="flex items-end gap-4 h-36">
          {ipAvailability.bars.map((b) => (
            <div key={b.key} className="w-8 bg-gray-100 rounded-md h-full flex">
              <div
                className="w-full self-end rounded-md"
                style={{
                  height: `${b.value}%`,
                  background:
                    "linear-gradient(180deg, #e2e8f0 0%, #86efac 100%)",
                }}
                title={`${b.value}%`}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
