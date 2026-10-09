import React, { useEffect, useState } from 'react';

interface MechanicalOdometerProps {
  value: number; // 0 to 100
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  statusText?: string;
  statusColor?: string;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const SingleDigitWheel: React.FC<{ targetDigit: number; height: number; digitWidth: number; fontSize: string }> = ({
  targetDigit,
  height,
  digitWidth,
  fontSize
}) => {
  return (
    <div
      className="relative overflow-hidden inline-flex items-center justify-center bg-[#051324] border-x border-[#0A2644]/50 select-none"
      style={{
        width: digitWidth,
        height: height
      }}
    >
      {/* Top and Bottom Chamber Shadow highlights */}
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
      
      {/* Center lens hairline indicator */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-white/10 pointer-events-none z-10" />

      {/* The scrolling column */}
      <div
        className="flex flex-col items-center will-change-transform"
        style={{
          transform: `translateY(-${targetDigit * height}px)`,
          transition: 'transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {DIGITS.map(d => (
          <div
            key={d}
            className={`flex items-center justify-center font-mono-tech font-bold text-[#E2EAF2] ${fontSize}`}
            style={{ height: height, width: digitWidth }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

export const MechanicalOdometer: React.FC<MechanicalOdometerProps> = ({
  value,
  label = 'CASE READINESS',
  unit = '%',
  size = 'md',
  statusText,
  statusColor = 'text-[#123B63]'
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const tens = Math.floor(clamped / 10) % 10;
  const ones = clamped % 10;
  
  // For 100%, we need a hundreds digit.
  const hundreds = Math.floor(clamped / 100);

  const dimensions = {
    sm: { height: 28, width: 20, font: 'text-sm', pad: 'p-1' },
    md: { height: 38, width: 28, font: 'text-xl', pad: 'p-1.5' },
    lg: { height: 50, width: 36, font: 'text-2xl', fontUnit: 'text-lg', pad: 'p-2' }
  }[size];

  return (
    <div className="inline-flex flex-col items-start select-none">
      {label && (
        <span className="font-mono-tech text-[10px] tracking-widest text-[#5B6B80] font-semibold mb-1 uppercase">
          {label}
        </span>
      )}

      <div className="flex flex-col gap-1.5">
        {/* Recessed chamber container */}
        <div
          className={`recessed-chamber inline-flex items-center gap-1 ${dimensions.pad}`}
        >
          <div className="flex items-center rounded-[2px] overflow-hidden border border-[#061526]">
            {hundreds > 0 && (
              <SingleDigitWheel
                targetDigit={hundreds}
                height={dimensions.height}
                digitWidth={dimensions.width}
                fontSize={dimensions.font}
              />
            )}
            <SingleDigitWheel
              targetDigit={tens}
              height={dimensions.height}
              digitWidth={dimensions.width}
              fontSize={dimensions.font}
            />
            <SingleDigitWheel
              targetDigit={ones}
              height={dimensions.height}
              digitWidth={dimensions.width}
              fontSize={dimensions.font}
            />
          </div>

          {unit && (
            <div
              className="flex items-center justify-center px-1.5 text-[#56A67A] font-mono-tech font-bold text-sm tracking-tight"
              style={{ height: dimensions.height }}
            >
              {unit}
            </div>
          )}
        </div>

        {statusText && (
          <div className={`font-mono-tech font-bold text-[11px] uppercase ${statusColor}`}>
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
};
