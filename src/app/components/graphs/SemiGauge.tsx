"use client";
import React from "react";

type Segment = { to: number; color: string };

type SemiGaugeProps = {
  value: number;                
  size?: number;                 
  thickness?: number;         
  startAngle?: number;        
  endAngle?: number;            
  segments?: Segment[];          
  needleColor?: string;
  trackColor?: string;
  showTicks?: boolean;
  className?: string;
  linearGradient?: boolean;
  overlayOpacity?: number;
};

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return { d: `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, start, end };
}

export default function SemiGauge({
  value,
  size = 220,
  thickness = 18,
  startAngle = -120,
  endAngle = 120,
 
  segments = [
    { to: 60, color: "#22C55E" },
    { to: 85, color: "#FACC15" },
    { to: 95, color: "#F59E0B" },
    { to: 100, color: "#FDE2E4" },
  ],
  needleColor = "#3B1AA2",
  trackColor = "#F3F4F6",
  showTicks = true,
  className,
  linearGradient = true,     
  overlayOpacity = 0.38,     
}: SemiGaugeProps) {
  const v = clamp(value);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thickness / 2;

  const span = endAngle - startAngle;
  const angleFor = (pct: number) => startAngle + (pct / 100) * span;

  
  const arc = describeArc(cx, cy, r, startAngle, endAngle);

  
  const needleAngle = angleFor(v);
  const needleLen = r * 0.75;
  const tip = polarToCartesian(cx, cy, needleLen, needleAngle);

  const ticks = [0, 25, 50, 75, 100].map((t) => {
    const a = angleFor(t);
    const p1 = polarToCartesian(cx, cy, r - thickness * 0.6, a);
    const p2 = polarToCartesian(cx, cy, r - thickness * 0.15, a);
    const label = polarToCartesian(cx, cy, r - thickness * 1.2, a);
    return { t, p1, p2, label };
  });

  
  const { start, end } = arc;

  return (
    <div className={className}>
      <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size}`}>
        <defs>
         
          <linearGradient
            id="gaugeBase"
            gradientUnits="userSpaceOnUse"
            x1={end.x}
            y1={end.y}
            x2={start.x}
            y2={start.y}
          >
      
            <stop offset="0%" stopColor="#00C247" />
            <stop offset="50%" stopColor="#FFCD0F" />
            <stop offset="100%" stopColor="#FF5B5B" />
          </linearGradient>
        
          <mask id="arcMask">
            <path
              d={arc.d}
              stroke="white"
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="round"
            />
          </mask>
        </defs>

      
        <path
          d={arc.d}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
        />

      
        {linearGradient ? (
          <>
            <g mask="url(#arcMask)">
              <rect x="0" y="0" width={size} height={size} fill="url(#gaugeBase)" />
            </g>
           
            <g mask="url(#arcMask)" opacity={overlayOpacity}>
              <rect x="0" y="0" width={size} height={size} fill="url(#gaugeSheen)" />
            </g>
          </>
        ) : (
      
          segments.map((seg, i) => {
            const toPct = clamp(seg.to);
            const sub = describeArc(cx, cy, r, angleFor(i === 0 ? 0 : segments[i - 1].to), angleFor(toPct));
            return (
              <path
                key={i}
                d={sub.d}
                stroke={seg.color}
                strokeWidth={thickness}
                fill="none"
                strokeLinecap="round"
              />
            );
          })
        )}

        
        {showTicks &&
          ticks.map(({ t, p1, p2, label }) => (
            <g key={t}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#E5E7EB"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <text
                x={label.x}
                y={label.y}
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#CBD5E1"
              >
                {t}
              </text>
            </g>
          ))}

    
        <line
          x1={cx}
          y1={cy}
          x2={tip.x}
          y2={tip.y}
          stroke={needleColor}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={8} fill="#ECEBFF" stroke={needleColor} />
      </svg>
    </div>
  );
}
