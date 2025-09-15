// app/components/RecentAlarms.tsx
import Card from "./Card";
import { recentAlarms } from "../../data/mock";

export default function RecentAlarms() {
  return (
    <Card title="RECENT ALARMS">
      <div className="space-y-3 max-h-[540px] overflow-auto pr-1">
        {recentAlarms.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3"
          >
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-orange-100 grid place-items-center">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
              </span>
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {a.id}
                </div>
                <div className="text-xs text-gray-500">{a.time}</div>
              </div>
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[160px]">
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
