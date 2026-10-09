import React from 'react';
import { RubberStamp } from './RubberStamp';

interface ResolutionStateProps {
  isSimulated?: boolean;
}

export const ResolutionState: React.FC<ResolutionStateProps> = ({ isSimulated = true }) => {
  return (
    <div className="bg-white border-2 border-[#56A67A] shadow-hard rounded-[2px] p-10 flex flex-col items-center justify-center text-center space-y-6 my-6">
      <RubberStamp variant="VERIFIED" size="lg" />
      
      <div className="space-y-2">
        <h2 className="font-display font-[800] text-3xl text-[#2E7D57] tracking-tight">
          CASE RESOLVED
        </h2>
        <p className="text-[#5B6B80] max-w-md mx-auto">
          All required actions have been completed and the necessary corrections have been submitted.
        </p>
      </div>

      <div className="bg-[#EBF7F0] border border-[#56A67A] px-6 py-3 rounded-[2px]">
        <div className="font-mono-tech text-sm font-bold text-[#2E7D57] uppercase tracking-widest">
          {isSimulated ? 'SIMULATED RESOLUTION' : 'RESOLUTION VERIFIED'}
        </div>
      </div>
    </div>
  );
};
