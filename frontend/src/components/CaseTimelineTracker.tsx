import React, { useState } from 'react';
import { CaseEvent, CaseStatus, CitizenCase } from '../types';
import { RubberStamp } from './RubberStamp';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Play, RefreshCw, Sparkles } from 'lucide-react';

interface CaseTimelineTrackerProps {
  currentCase: CitizenCase;
  onUpdateCase: (updatedCase: CitizenCase) => void;
}

const STATE_FLOW: { state: CaseStatus; label: string }[] = [
  { state: 'NEW', label: '1. New Case' },
  { state: 'UNDERSTANDING', label: '2. Understood' },
  { state: 'DIAGNOSED', label: '3. Diagnosed' },
  { state: 'ACTION_READY', label: '4. Action Ready' },
  { state: 'CITIZEN_ACTION_REQUIRED', label: '5. Citizen Action' },
  { state: 'SUBMITTED', label: '6. Submitted' },
  { state: 'WAITING', label: '7. Waiting (NPCI)' },
  { state: 'FOLLOW_UP_REQUIRED', label: '8. Follow-up' },
  { state: 'RESOLVED', label: '9. Resolved' }
];

export const CaseTimelineTracker: React.FC<CaseTimelineTrackerProps> = ({
  currentCase,
  onUpdateCase
}) => {
  const [simulationInProgress, setSimulationInProgress] = useState(false);

  const getStatusIndex = (st: CaseStatus) => {
    const idx = STATE_FLOW.findIndex(s => s.state === st);
    return idx === -1 ? 3 : idx;
  };

  const currentIndex = getStatusIndex(currentCase.status);

  // Simulation handlers per Section 10
  const handleSimulateBankSubmitted = () => {
    const newEvent: CaseEvent = {
      id: `EV-SIM-${Date.now()}`,
      caseId: currentCase.id,
      timestamp: 'Today · 14:20',
      eventType: 'CITIZEN_ACTION_MARKED',
      title: 'Citizen Submitted Mandate at Canara Bank',
      description: 'Lakshmi visited Thiruvaiyaru branch, submitted Annexure I, and received stamped CBS SR acknowledgement #SR-88912.',
      actor: 'CITIZEN'
    };

    onUpdateCase({
      ...currentCase,
      status: 'WAITING',
      readinessPercentage: 75,
      events: [...currentCase.events, newEvent]
    });
  };

  const handleSimulateDay3Reminder = () => {
    const newEvent: CaseEvent = {
      id: `EV-SIM-DAY3-${Date.now()}`,
      caseId: currentCase.id,
      timestamp: '+3 Days · 09:00',
      eventType: 'SIMULATED_DAY_3_REMINDER',
      title: 'Automated Day 3 Bank Processing Check',
      description: 'System pinged Canara Bank CBS status. CBS updated; NPCI clearing house sync in transit.',
      actor: 'SORTED_AI'
    };

    onUpdateCase({
      ...currentCase,
      status: 'WAITING',
      readinessPercentage: 85,
      events: [...currentCase.events, newEvent]
    });
  };

  const handleSimulateResolve = () => {
    const newEvent: CaseEvent = {
      id: `EV-SIM-RESOLVED-${Date.now()}`,
      caseId: currentCase.id,
      timestamp: '+7 Days · 11:30',
      eventType: 'RESOLVED',
      title: 'Benefit Resolved & Payment Disbursed',
      description: 'PFMS re-triggered payment lot. Rs 2,000 PM-KISAN instalment successfully credited to Canara Bank A/C 1204XXXX89234.',
      actor: 'DEPARTMENT'
    };

    onUpdateCase({
      ...currentCase,
      status: 'RESOLVED',
      readinessPercentage: 100,
      events: [...currentCase.events, newEvent]
    });
  };

  const handleResetSimulation = () => {
    onUpdateCase({
      ...currentCase,
      status: 'ACTION_READY',
      readinessPercentage: 42,
      events: currentCase.events.filter(e => !e.id.startsWith('EV-SIM-'))
    });
  };

  return (
    <div className="w-full pb-12">
      <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-technical text-[#123B63] font-bold uppercase">
              STATE MACHINE // AUDITABLE CASE LIFECYCLE
            </span>
            <span className="text-[10px] font-mono-tech text-[#5B6B80]">
              STATE: {currentCase.status}
            </span>
          </div>
          <h2 className="text-page-heading text-[#0C2A47] mt-1">
            Case Lifecycle State Machine & Event Ledger
          </h2>
          <p className="text-supporting mt-0.5">
            Deterministic state machine tracks case from diagnosis to official disbursement credit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentCase.status === 'RESOLVED' ? (
            <RubberStamp variant="RESOLVED" size="md" label="CASE RESOLVED" />
          ) : (
            <RubberStamp variant="ACTION_REQUIRED" size="md" label={currentCase.status} />
          )}
        </div>
      </div>

      {/* State Progress Bar (Hardware Stepper) */}
      <div className="bg-[#0C2A47] p-4 rounded-[2px] text-white border border-[#123B63]">
        <div className="flex items-center justify-between pb-3 border-b border-[#123B63] mb-3">
          <span className="text-technical text-[#E2EAF2] uppercase">
            AUTOMATION PIPELINE: 9-STAGE FINITE STATE MACHINE
          </span>
          <span className="font-mono-tech text-xs text-[#56A67A] font-bold">
            STAGE {currentIndex + 1} OF {STATE_FLOW.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center">
          {STATE_FLOW.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={step.state}
                className={`p-2 rounded-[2px] border text-xs font-mono-tech flex flex-col items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-[#123B63] border-[#F4B942] text-white font-bold ring-1 ring-[#F4B942]'
                    : isCompleted
                    ? 'bg-[#081D33] border-[#56A67A] text-[#56A67A]'
                    : 'bg-[#081D33]/40 border-[#061526] text-[#5B6B80]'
                }`}
              >
                <div className="text-[10px] opacity-75">{idx + 1}</div>
                <div className="text-[11px] font-bold truncate w-full">
                  {step.state}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive State Simulation Controls (Blueprint Section 10 & 20) */}
      <div className="bg-[#F7FAFC] border-2 border-[#123B63] p-4 rounded-[2px] shadow-hard-sm">
        <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-[#123B63]" />
            <span className="font-display font-[800] text-xs text-[#0C2A47] uppercase">
              INTERACTIVE DEMO SIMULATOR // ADVANCE CASE EVENTS
            </span>
          </div>
          <span className="font-mono-tech text-[10px] text-[#5B6B80]">
            DEMO MODE CONTROLS
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateBankSubmitted}
            disabled={currentCase.status === 'WAITING' || currentCase.status === 'RESOLVED'}
            className="btn-instrument bg-white text-[#123B63] px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D57]" />
            <span>SIMULATE: CITIZEN SUBMITS AT BANK</span>
          </button>

          <button
            onClick={handleSimulateDay3Reminder}
            disabled={currentCase.status !== 'WAITING'}
            className="btn-instrument bg-white text-[#123B63] px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <Clock className="w-3.5 h-3.5 text-[#D99020]" />
            <span>SIMULATE: +3 DAYS CBS VERIFICATION</span>
          </button>

          <button
            onClick={handleSimulateResolve}
            disabled={currentCase.status === 'RESOLVED'}
            className="btn-instrument bg-[#56A67A] text-white px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>SIMULATE: +7 DAYS PAYMENT RESOLUTION</span>
          </button>

          <button
            onClick={handleResetSimulation}
            className="text-xs font-mono-tech text-[#5B6B80] hover:text-[#123B63] px-2 py-1 flex items-center gap-1 ml-auto"
          >
            <RefreshCw className="w-3 h-3" />
            <span>RESET TO DIAGNOSED</span>
          </button>
        </div>
      </div>

      {/* Immutable Event Ledger Audit Log */}
      <div className="bg-white border border-[#DCE5ED] shadow-hard p-5 rounded-[2px] space-y-4">
        <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-2">
          <span className="font-display font-[800] text-sm text-[#0C2A47] uppercase">
            IMMUTABLE CASE EVENT LEDGER ({currentCase.events.length} EVENTS RECORDED)
          </span>
          <span className="font-mono-tech text-[10px] text-[#5B6B80]">
            AUDIT TRAIL PRESERVED
          </span>
        </div>

        <div className="relative border-l-2 border-[#123B63] ml-3 pl-5 space-y-5">
          {currentCase.events.filter(e => !e.caseId || e.caseId === currentCase.id).map((ev, index) => (
            <div key={ev.id} className="relative">
              {/* Node indicator */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-[1px] bg-[#123B63] border-2 border-white shadow-sm flex items-center justify-center">
                <div className="w-1 h-1 bg-white" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-tech text-xs text-[#5B6B80]">
                    {ev.timestamp}
                  </span>
                  <span className="text-[10px] font-mono-tech font-bold text-[#123B63] bg-[#F7FAFC] px-1.5 py-0.2 border border-[#DCE5ED]">
                    ACTOR: {ev.actor}
                  </span>
                  <span className="text-[10px] font-mono-tech text-[#56A67A] font-bold">
                    {ev.eventType}
                  </span>
                </div>

                <h4 className="font-display font-[800] text-sm text-[#0C2A47]">
                  {ev.title}
                </h4>

                <p className="text-xs text-[#17212B] leading-relaxed">
                  {ev.description}
                </p>
              </div>
            </div>
          ))}

          {currentCase.status !== 'RESOLVED' && (
            <div className="relative opacity-60">
              {/* Hollow Node indicator */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-[1px] bg-white border-2 border-[#123B63] shadow-sm flex items-center justify-center">
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-[800] text-sm text-[#5B6B80]">
                  Awaiting {currentCase.actions && currentCase.actions.length > 0 ? 'Correction / Action' : 'Information'}
                </h4>
                <p className="text-xs text-[#5B6B80] leading-relaxed italic">
                  Pending physical action or system update.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};
