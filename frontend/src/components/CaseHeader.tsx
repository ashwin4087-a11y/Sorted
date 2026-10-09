import React from 'react';
import { CitizenCase } from '../types';
import { RubberStamp } from './RubberStamp';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CaseHeaderProps {
  currentCase: CitizenCase;
  onGoToFix: () => void;
  onOpenChatbot?: () => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ currentCase, onGoToFix, onOpenChatbot }) => {
  const hasActions = currentCase.actions && currentCase.actions.length > 0;
  const isResolved = currentCase.status === 'RESOLVED' || (currentCase.journey === 'PRE_SUBMISSION_HEALTH_CHECK' && !hasActions && currentCase.ruleTraces.length > 0);
  
  let currentBlocker = 'NONE';
  if (currentCase.journey === 'PRE_SUBMISSION_HEALTH_CHECK') {
    const blockingTrace = currentCase.ruleTraces.find(t => t.resultStatus === 'FAIL');
    if (blockingTrace) {
      currentBlocker = blockingTrace.ruleName.replace(/_/g, ' ');
    } else if (currentCase.ruleTraces.length > 0) {
      currentBlocker = 'CLEAR';
    }
  } else {
    if (currentCase.diagnosis) {
      if (currentCase.diagnosis.isUnknownReason) {
        currentBlocker = 'UNKNOWN FAILURE REASON';
      } else {
        currentBlocker = currentCase.diagnosis.code.replace(/_/g, ' ');
      }
    }
  }

  let nextActionText = isResolved ? 'Application is ready for processing.' : 'Awaiting input or analysis.';
  if (hasActions) {
    nextActionText = currentCase.actions[0].title;
  } else if (currentCase.status === 'NEEDS_INFO') {
    nextActionText = 'Obtain payment failure reason from relevant authority.';
  }

  let statusColor = 'text-[#56A67A]';
  if (currentCase.status === 'CITIZEN_ACTION_REQUIRED' || currentCase.status === 'ACTION_READY') {
    statusColor = 'text-[#B23A3A]';
  } else if (currentCase.status === 'NEEDS_INFO') {
    statusColor = 'text-[#D99020]';
  }

  const journeyLabel = currentCase.journey === 'PRE_SUBMISSION_HEALTH_CHECK' 
    ? 'Pre-Submission Health Check' 
    : 'Payment Resolution';

  return (
    <div className="bg-[#0C2A47] text-[#E2EAF2] border-b border-[#061526] shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Col 1: Identity */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <RubberStamp variant="DEMO_DATA" size="sm" />
          </div>
          <div className="text-technical text-[#5B6B80] mb-2">
            SORTED / {currentCase.caseRef}
          </div>
          <div className="text-section-heading text-white uppercase">
            {currentCase.citizenName}
          </div>
          <div className="text-sm font-mono-tech text-[#8EA2B8]">
            {journeyLabel}
          </div>
        </div>

        {/* Col 2: Status & Blocker */}
        <div className="space-y-4 col-span-1 md:col-span-2 grid grid-cols-2">
          <div>
            <div className="text-technical text-[#5B6B80] mb-1">
              STATUS
            </div>
            <div className={`font-mono-tech font-bold text-sm ${statusColor}`}>
              {currentCase.status.replace(/_/g, ' ')}
            </div>
          </div>
          
          <div>
            <div className="text-technical text-[#5B6B80] mb-1">
              CURRENT BLOCKER
            </div>
            <div className="font-mono-tech font-bold text-sm text-[#F4B942]">
              {currentBlocker}
            </div>
          </div>
        </div>

        {/* Col 3: Next Action */}
        <div className="bg-[#123B63]/50 p-4 border border-[#123B63] rounded-[2px] flex flex-col justify-between">
          <div>
            <div className="text-technical text-[#8EA2B8] mb-1">
              NEXT ACTION
            </div>
            <div className="text-sm text-white font-medium leading-tight">
              {nextActionText}
            </div>
          </div>
          {hasActions && (
            <button
              onClick={onGoToFix}
              className="mt-3 flex items-center justify-between w-full bg-white text-[#123B63] hover:bg-[#F7FAFC] px-3 py-1.5 text-[11px] font-mono-tech font-bold uppercase transition-colors rounded-[1px]"
            >
              <span>View Fix Passport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenChatbot && (
            <button
              onClick={onOpenChatbot}
              className="mt-2 flex items-center justify-between w-full border border-white text-white hover:bg-white/10 px-3 py-1.5 text-[11px] font-mono-tech font-bold uppercase transition-colors rounded-[1px]"
            >
              <span>Open SORTED AI</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
