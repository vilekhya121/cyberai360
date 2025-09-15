/* eslint-disable @typescript-eslint/no-explicit-any */
import dynamic from "next/dynamic";
import SkeletonLoader from "../loaders/SkeletonLoader";
const GaugeComponent = dynamic(() => import("react-gauge-component"), {
  ssr: false,
});

function PieNeedleComponent({gaugeData,status}:any) {

  if(status == "connecting") {
    return <SkeletonLoader />
  }


  return (
    <div style={{ width: "100%", height: '100%' }}>
      <GaugeComponent
        value={gaugeData?.current_value}
        type="radial"
        labels={{
          tickLabels: {
            type: "inner",
            ticks: [
              // { value: 20 },
              // { value: 40 },
              // { value: 60 },
              // { value: 80 },
              // { value: 100 },
            ],
          },
          valueLabel: {
            style:{
              fill: "#000",
              fontWeight: 'bold'
              // fontSize: '20px'
            }
          }
        }}
        arc={{
          colorArray: ["#5BE12C", "#EA4228"],
          subArcs: [{ limit: 10 }, { limit: 30 }, {}, {}, {}],
          padding: 0.02,
          width: 0.3,
        }}
        pointer={{
          elastic: true,
          animationDelay: 0,
        }}
      />
    </div>
  );
}

export default PieNeedleComponent;
