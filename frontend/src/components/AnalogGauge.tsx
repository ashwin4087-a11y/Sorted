import React from 'react';

interface AnalogGaugeProps {
  currentValue: number; // 0 to 100
  targetValue?: number; // 0 to 100
  label?: string;
  sublabel?: string;
  size?: number; // width in px
  className?: string;
}

export const AnalogGauge: React.FC<AnalogGaugeProps> = ({
  currentValue,
  targetValue = 100,
  label = 'CASE RESOLUTION GAUGE',
  sublabel = 'CALIBRATED READOUT',
  size = 220,
  className = ''
}) => {
  // Map 0 -> -90 deg, 100 -> +90 deg
  const currentAngle = -90 + (Math.max(0, Math.min(100, currentValue)) / 100) * 180;
  const targetAngle = -90 + (Math.max(0, Math.min(100, targetValue)) / 100) * 180;

  const height = size * 0.62;
  const radius = size * 0.42;
  const cx = size / 2;
  const cy = height - 12;

  // Arc calculations
  // Red zone: 0 to 40% (angle -90 to -18)
  // Amber zone: 40 to 75% (angle -18 to +45)
  // Green zone: 75 to 100% (angle +45 to +90)

  return (
    <div className={`inline-flex flex-col items-center select-none bg-white border border-[#DCE5ED] shadow-hard p-3 rounded-[2px] ${className}`}>
      <div className="w-full flex items-center justify-between border-b border-[#DCE5ED] pb-1 mb-2">
        <span className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono-tech text-[9px] text-[#123B63] bg-[#F7FAFC] px-1 py-0.5 border border-[#DCE5ED]">
          180° ARC
        </span>
      </div>

      <div className="relative" style={{ width: size, height: height }}>
        <svg
          width={size}
          height={height}
          viewBox={`0 0 ${size} ${height}`}
          className="overflow-visible"
        >
          <defs>
            {/* Gauge Dial Drop Shadow */}
            <radialGradient id="dialGrad" cx="50%" cy="100%" r="90%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F7FAFC" />
            </radialGradient>
          </defs>

          {/* Background Dial Base */}
          <path
            d={`M ${cx - radius - 10} ${cy} A ${radius + 10} ${radius + 10} 0 0 1 ${cx + radius + 10} ${cy} Z`}
            fill="url(#dialGrad)"
            stroke="#DCE5ED"
            strokeWidth="1.5"
          />

          {/* Critical Red Zone Arc (0% - 40%) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx - radius * Math.cos(18 * Math.PI / 180)} ${cy - radius * Math.sin(18 * Math.PI / 180)}`}
            fill="none"
            stroke="#C95C5C"
            strokeWidth="9"
            strokeLinecap="butt"
          />

          {/* Attention Amber Zone Arc (40% - 75%) */}
          <path
            d={`M ${cx - radius * Math.cos(18 * Math.PI / 180)} ${cy - radius * Math.sin(18 * Math.PI / 180)} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos(45 * Math.PI / 180)} ${cy - radius * Math.sin(45 * Math.PI / 180)}`}
            fill="none"
            stroke="#F4B942"
            strokeWidth="9"
            strokeLinecap="butt"
          />

          {/* Verified Green Zone Arc (75% - 100%) */}
          <path
            d={`M ${cx + radius * Math.cos(45 * Math.PI / 180)} ${cy - radius * Math.sin(45 * Math.PI / 180)} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#56A67A"
            strokeWidth="9"
            strokeLinecap="butt"
          />

          {/* Inner measurement tick marks */}
          {Array.from({ length: 11 }).map((_, i) => {
            const tickAngle = -90 + i * 18;
            const rad = (tickAngle * Math.PI) / 180;
            const rInner = radius - 14;
            const rOuter = radius - (i % 2 === 0 ? 6 : 9);
            const x1 = cx + rInner * Math.cos(rad);
            const y1 = cy + rInner * Math.sin(rad);
            const x2 = cx + rOuter * Math.cos(rad);
            const y2 = cy + rOuter * Math.sin(rad);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#123B63"
                strokeWidth={i % 2 === 0 ? 1.5 : 1}
                strokeOpacity={0.6}
              />
            );
          })}

          {/* Target / Projected State Needle (Dashed Amber) */}
          <g
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotate(${targetAngle}deg)`,
              transition: 'transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - radius + 2}
              stroke="#D99020"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeOpacity={0.9}
            />
          </g>

          {/* Current State Needle (Solid Dark Navy / Precision Pointer) */}
          <g
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: `rotate(${currentAngle}deg)`,
              transition: 'transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Needle Body */}
            <polygon
              points={`${cx - 3},${cy} ${cx},${cy - radius + 4} ${cx + 3},${cy}`}
              fill="#123B63"
            />
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - radius + 2}
              stroke="#FFFFFF"
              strokeWidth="1"
            />
          </g>

          {/* Heavy Mechanical Center Pivot Hub */}
          <circle cx={cx} cy={cy} r="9" fill="#0C2A47" stroke="#123B63" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="4" fill="#E2EAF2" />
          <circle cx={cx} cy={cy} r="1.5" fill="#123B63" />
        </svg>

        {/* Needle Readout Labels at Base */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 text-[9px] font-mono-tech text-[#5B6B80] font-semibold">
          <span>0% BLOCKED</span>
          <span className="text-[#D99020]">TARGET: {targetValue}%</span>
          <span className="text-[#2E7D57]">100% READY</span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-[#DCE5ED] text-xs">
        <span className="font-mono-tech text-[10px] text-[#5B6B80]">CURRENT VALUE</span>
        <span className="font-mono-tech font-bold text-sm text-[#123B63]">
          {Math.round(currentValue)}%
        </span>
      </div>
    </div>
  );
};
