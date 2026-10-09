import React from 'react';
import { CitizenCase } from '../types';
import { RubberStamp } from './RubberStamp';
import { ResolutionState } from './ResolutionState';
import { MapPin, Clock, CheckSquare, AlertCircle, FileCheck, Printer } from 'lucide-react';

interface OneTripPlannerViewProps {
  currentCase: CitizenCase;
}

export const OneTripPlannerView: React.FC<OneTripPlannerViewProps> = ({
  currentCase
}) => {
  const bankDoc = currentCase.documents.find(d => d.docType === 'BANK_PASSBOOK');

  const trips = currentCase.actions.map((action, index) => ({
    id: action.id,
    tripNumber: index + 1,
    problem: action.problem || 'Action required to proceed with application.',
    whyItMatters: action.whyItMatters || 'This must be completed before the scheme can process your request.',
    destinationName: action.destinationLabel,
    destinationType: action.destination,
    operatingHours: action.destination === 'BANK' ? '10:00 AM – 02:00 PM (Monday to Friday, avoid 2nd/4th Saturday)' : '11:00 AM – 04:00 PM (Working days)',
    purpose: action.title,
    counterToApproach: action.destination === 'BANK' ? 'Customer Service / Accounts Service Desk' : 'Scheme Nodal Officer Desk',
    whatToCarry: action.whatToCarry,
    exactStatementToStaff: action.exactStatementToStaff || action.instructions.join(' '),
    nonNegotiableExitCriteria: 'DO NOT LEAVE WITHOUT: ' + action.expectedOutput,
    turnaroundTime: action.turnaroundTime || 'Varies by authority'
  }));

  return (
    <div className="w-full pb-12">
      <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-technical text-[#123B63] font-bold uppercase">
              EFFICIENCY ENGINE // ONE-TRIP LOGISTICS
            </span>
            <span className="text-[10px] font-mono-tech text-[#5B6B80]">
              DEPENDENCY GRAPH COMPILED
            </span>
          </div>
          <h2 className="text-page-heading text-[#0C2A47] mt-1">
            Citizen One-Trip Logistics Planner
          </h2>
          <p className="text-supporting mt-0.5">
            Actions topologically sorted by physical destination so the citizen makes the minimum visits without repeated trips.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-instrument bg-[#123B63] text-white px-4 py-2 text-xs flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>PRINT TRIP CHECKLIST</span>
        </button>
      </div>

      {currentCase.status === 'RESOLVED' ? (
        <ResolutionState />
      ) : trips.length > 0 ? (
      <div className="space-y-5">
        {/* Trips Timeline */}
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white border-2 border-[#123B63] shadow-hard rounded-[2px] overflow-hidden"
          >
            <div className="bg-[#123B63] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="text-component-heading uppercase">
                FIX PASSPORT // STEP {trip.tripNumber}
              </h3>
              <RubberStamp
                variant={trip.tripNumber === 1 ? 'ACTION_REQUIRED' : 'PENDING'}
                size="sm"
              />
            </div>

            <div className="p-5 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-5 border-b border-[#DCE5ED]">
                <div>
                  <div className="text-technical text-[#B23A3A] font-bold uppercase mb-1">PROBLEM</div>
                  <div className="text-sm text-[#17212B] font-medium leading-relaxed">{trip.problem}</div>
                </div>
                <div>
                  <div className="text-technical text-[#5B6B80] font-bold uppercase mb-1">WHY THIS MATTERS</div>
                  <div className="text-sm text-[#17212B] leading-relaxed">{trip.whyItMatters}</div>
                </div>
              </div>

              <div>
                <div className="text-technical text-[#123B63] font-bold uppercase mb-1">NEXT ACTION</div>
                <div className="text-lg font-display font-[800] text-[#0C2A47] uppercase tracking-wide">
                  {trip.purpose}
                </div>
              </div>

              <div className="bg-[#F7FAFC] border border-[#DCE5ED] p-4 rounded-[2px]">
                <div className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase mb-2 tracking-wider">GO HERE</div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-[#123B63]" />
                  <span className="font-bold text-[#0C2A47]">{trip.destinationName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono-tech text-[#5B6B80]">
                  <Clock className="w-4 h-4" />
                  <span>{trip.operatingHours} • Counter: {trip.counterToApproach}</span>
                </div>
              </div>

              <div>
                <div className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase mb-2 tracking-wider">CARRY</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trip.whatToCarry.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-[#17212B]">
                      <CheckSquare className="w-4 h-4 text-[#2E7D57] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#FEF7EA] border border-[#F4B942] p-4 rounded-[2px]">
                <div className="font-mono-tech text-[10px] text-[#D99020] font-bold uppercase mb-2 tracking-wider">SAY / REQUEST</div>
                <p className="text-sm text-[#17212B] italic font-medium">"{trip.exactStatementToStaff}"</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#DCE5ED]">
                <div>
                  <div className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase mb-1 tracking-wider">AFTER</div>
                  <div className="text-sm font-bold text-[#2E7D57] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {trip.nonNegotiableExitCriteria}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase mb-1 tracking-wider">STATUS</div>
                  <div className="font-mono-tech text-xs font-bold text-[#B23A3A] bg-[#FEF2F2] border border-[#FECACA] px-2 py-1 inline-block">
                    ACTION REQUIRED
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="bg-white p-6 border-2 border-[#DCE5ED] text-center text-[#5B6B80] font-mono-tech">
          No pending trips.
        </div>
      )}

      {currentCase.journey === 'PRE_SUBMISSION_HEALTH_CHECK' && currentCase.actions.length > 0 && (
        <div className="mt-8 bg-white border border-[#DCE5ED] p-4 flex items-center justify-between shadow-hard-sm">
          <div>
            <div className="font-mono-tech text-[10px] text-[#5B6B80] uppercase tracking-wider mb-1">
              APPLICATION STATUS
            </div>
            <div className="font-display font-[800] text-lg text-[#B23A3A] uppercase tracking-wide">
              NOT READY
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono-tech font-bold text-sm text-[#0C2A47]">
              {currentCase.actions.length} ACTION{currentCase.actions.length > 1 ? 'S' : ''} REQUIRED
            </div>
            <div className="text-[10px] font-mono-tech text-[#5B6B80] mt-1 max-w-[200px]">
              Resolve the detected discrepancies before proceeding with submission.
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
