 "use client";
import Image from "next/image";
import SemiGauge from "@/app/components/graphs/SemiGauge"; 
import Icon from "../../../../public/pie.png"
type VmAvailabilityData = {
  affected: number;         
  total: number;            
  availabilityPct: number;  
  lastDowntimeMins: number; 
  note?: string;            
};

export default function VmAvailabilityCard({
  data,
  
}: {
  data: VmAvailabilityData;
  
}) {
  const { affected, total, availabilityPct, lastDowntimeMins } = data;

  const defaultNote = `VM availability is at ${availabilityPct}%, indicating normal operations. The last downtime occurred ${lastDowntimeMins} minutes ago, but no critical issues are detected.`;

  return (
    <div className="bg-white shadow-sm rounded-xl border-2 border-zinc-200 h-full">
      <div className="border-b-2 border-gray-200 p-3">
        <h2 className="text-md font-bold uppercase tracking-wide">
          VM Availability Status
        </h2>
      </div>

      <div className="p-3">
        {/* VMs Affected */}
        <div className="flex items-center gap-3">
          
            <Image
              src={Icon}
              alt="VMs Affected"
              width={60}
              height={60}
              className="object-contain"
            />
          
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 font-semibold">
              VMs Affected
            </p>
            <p className="text-base font-semibold text-zinc-900">
              {affected} <span className="text-zinc-500">out of</span> {total}
            </p>
          </div>
        </div>

        {/* Status text */}
        <p className="mt-3 mb-12 text-[15px] leading-5 text-zinc-600 italic">
          {defaultNote}
        </p>

        {/* Gauge */}
        <div className="relative mt-2">
           <SemiGauge
                value={availabilityPct}
                size={240}
                thickness={18}
                linearGradient
                overlayOpacity={0.4}
                className="w-full max-w-[280px] mx-auto mt-10"
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

          {/* Big percentage label */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
            <span className="text-3xl font-extrabold text-zinc-800">
              {availabilityPct}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
