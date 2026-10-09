import React from 'react';

interface WarningHatchProps {
  variant?: 'amber' | 'red';
  height?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export const WarningHatch: React.FC<WarningHatchProps> = ({
  variant = 'amber',
  height = 'auto',
  className = '',
  children
}) => {
  const hatchClass = variant === 'red' ? 'hatch-red' : 'hatch-amber';
  const borderClass = variant === 'red' ? 'border-[#9C2828]' : 'border-[#17212B]';

  return (
    <div
      className={`relative border-2 ${borderClass} rounded-[2px] overflow-hidden ${className}`}
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Hatch background layer */}
      <div className={`absolute inset-0 ${hatchClass} opacity-95`} />

      {/* Content wrapper with contrast plate if children exist */}
      {children && (
        <div className="relative z-10 m-1 bg-white border border-[#17212B] p-3 text-sm shadow-sm">
          {children}
        </div>
      )}
    </div>
  );
};
