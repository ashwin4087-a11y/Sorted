import React from 'react';

export type StampVariant = 
  | 'VERIFIED'
  | 'ACTION_REQUIRED'
  | 'BLOCKED'
  | 'PENDING'
  | 'RESOLVED'
  | 'USER_CONFIRMED'
  | 'AI_GENERATED'
  | 'DEMO_DATA'
  | 'DRAFT';

interface RubberStampProps {
  label?: string;
  variant: StampVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RubberStamp: React.FC<RubberStampProps> = ({
  label,
  variant,
  size = 'md',
  className = ''
}) => {
  const displayLabel = label || {
    VERIFIED: 'VERIFIED',
    ACTION_REQUIRED: 'ACTION REQUIRED',
    BLOCKED: 'BLOCKED',
    PENDING: 'PENDING',
    RESOLVED: 'RESOLVED',
    USER_CONFIRMED: 'USER CONFIRMED',
    AI_GENERATED: 'AI GENERATED',
    DEMO_DATA: 'DEMO DATA',
    DRAFT: 'DRAFT'
  }[variant];

  // Strictly semantic color assignments per section 3 & 16
  const stylesByVariant: Record<StampVariant, string> = {
    VERIFIED: 'text-[#2E7D57] border-[#56A67A] bg-[#EBF7F0]/80',
    RESOLVED: 'text-[#2E7D57] border-[#56A67A] bg-[#EBF7F0]/80',
    ACTION_REQUIRED: 'text-[#D99020] border-[#F4B942] bg-[#FEF7EA]/90',
    PENDING: 'text-[#D99020] border-[#F4B942] bg-[#FEF7EA]/90',
    BLOCKED: 'text-[#B23A3A] border-[#C95C5C] bg-[#FDF2F2]/90',
    USER_CONFIRMED: 'text-[#123B63] border-[#123B63] bg-[#F7FAFC]',
    AI_GENERATED: 'text-[#123B63] border-[#123B63] bg-[#F7FAFC]',
    DEMO_DATA: 'text-[#5B6B80] border-[#5B6B80] bg-[#F7FAFC]',
    DRAFT: 'text-[#5B6B80] border-[#5B6B80] bg-[#F7FAFC]'
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider border-[1.5px]',
    md: 'text-xs px-2.5 py-1 tracking-wider border-2',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest border-[2.5px]'
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-display font-[800] uppercase select-none rounded-[2px] leading-none shrink-0 ${stylesByVariant[variant]} ${sizeClasses[size]} ${className}`}
      style={{
        transform: 'rotate(-1.2deg)',
        boxShadow: '1px 1px 0px rgba(18, 59, 99, 0.15)'
      }}
    >
      {displayLabel}
    </span>
  );
};
