import React from 'react';
import { SortedLogo } from './SortedLogo';

interface EntryScreenProps {
  onSelectJourney: (journey: 'PRE' | 'POST') => void;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({ onSelectJourney }) => {
  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-6 text-[#17212B]">
      <div className="max-w-2xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <SortedLogo size="lg" />
          </div>
          <h1 className="font-display font-[800] text-3xl md:text-5xl text-[#0C2A47] tracking-tight uppercase">
            The Last-Mile<br />Government Benefits Agent
          </h1>
          <p className="font-mono-tech text-sm md:text-base text-[#5B6B80] max-w-lg mx-auto">
            myScheme tells you what you may be eligible for.<br />
            SORTED helps make sure you actually get it.
          </p>
        </div>

        <div className="w-full h-px bg-[#DCE5ED]" />

        <div className="grid md:grid-cols-2 gap-8">
          {/* Before You Apply */}
          <div className="bg-white border-2 border-[#123B63] p-8 shadow-hard flex flex-col items-center text-center space-y-6 hover:-translate-y-1 transition-transform">
            <div className="space-y-2">
              <h2 className="font-display font-[800] text-xl text-[#123B63] uppercase tracking-wide">
                Before You Apply
              </h2>
              <p className="text-sm text-[#5B6B80] font-medium leading-relaxed">
                Check your documents<br />for potential blockers.
              </p>
            </div>
            
            <button
              onClick={() => onSelectJourney('PRE')}
              className="w-full bg-[#123B63] hover:bg-[#0C2A47] text-white font-mono-tech font-bold uppercase text-xs py-3 px-4 rounded-[2px] shadow-sm transition-colors"
            >
              Run Health Check
            </button>
          </div>

          {/* After You Apply */}
          <div className="bg-white border-2 border-[#DCE5ED] p-8 flex flex-col items-center text-center space-y-6 hover:border-[#123B63] transition-colors">
            <div className="space-y-2">
              <h2 className="font-display font-[800] text-xl text-[#0C2A47] uppercase tracking-wide">
                After You Apply
              </h2>
              <p className="text-sm text-[#5B6B80] font-medium leading-relaxed">
                Find out why your benefit<br />is stuck.
              </p>
            </div>
            
            <button
              onClick={() => onSelectJourney('POST')}
              className="w-full border-2 border-[#123B63] text-[#123B63] hover:bg-[#F7FAFC] font-mono-tech font-bold uppercase text-xs py-3 px-4 rounded-[2px] transition-colors"
            >
              Diagnose A Payment Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
