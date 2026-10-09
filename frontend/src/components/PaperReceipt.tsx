import React from 'react';
import { RubberStamp, StampVariant } from './RubberStamp';

interface PaperReceiptProps {
  title: string;
  caseRef: string;
  date: string;
  stamp?: StampVariant;
  stampLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PaperReceipt: React.FC<PaperReceiptProps> = ({
  title,
  caseRef,
  date,
  stamp = 'AI_GENERATED',
  stampLabel,
  children,
  actions,
  className = ''
}) => {
  return (
    <div
      className={`relative bg-white border border-[#DCE5ED] shadow-hard p-6 text-[#17212B] rounded-[2px] font-body-gov ${className}`}
    >
      {/* Top simulated perforation row */}
      <div className="absolute top-0 inset-x-0 h-[3px] flex justify-between overflow-hidden px-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-[#DCE5ED] mx-0.5 rounded-b-[1px]" />
        ))}
      </div>

      {/* Header technical bar */}
      <div className="flex flex-wrap items-start justify-between border-b-2 border-[#123B63] pb-3 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[10px] text-[#123B63] font-bold tracking-widest uppercase">
              SORTED / ADMINISTRATIVE ACTION ARTIFACT
            </span>
          </div>
          <h3 className="font-display font-[800] text-xl text-[#0C2A47] tracking-tight mt-0.5">
            {title}
          </h3>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech font-bold text-xs text-[#123B63] bg-[#F7FAFC] px-2 py-0.5 border border-[#DCE5ED]">
              {caseRef}
            </span>
            <span className="font-mono-tech text-xs text-[#5B6B80]">
              {date}
            </span>
          </div>
          <div className="mt-1.5">
            <RubberStamp variant={stamp} label={stampLabel} size="sm" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4 text-sm leading-relaxed text-[#17212B]">
        {children}
      </div>

      {/* Bottom Actions & Statutory Footer */}
      <div className="mt-6 pt-4 border-t border-[#DCE5ED] flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-mono-tech text-[#5B6B80]">
          OFFICIAL VERIFICATION NOTICE: PRESENT THIS DRAFT WITH PRIMARY ORIGINAL DOCUMENTS
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom simulated perforation row */}
      <div className="absolute bottom-0 inset-x-0 h-[3px] flex justify-between overflow-hidden px-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-[#DCE5ED] mx-0.5 rounded-t-[1px]" />
        ))}
      </div>
    </div>
  );
};
