import React, { useState } from 'react';
import { CitizenCase, RuleTraceItem, getResolutionProgress, getStatusColor } from '../types';
import { RubberStamp } from './RubberStamp';
import { MechanicalOdometer } from './MechanicalOdometer';
import { AnalogGauge } from './AnalogGauge';
import { WarningHatch } from './WarningHatch';
import { 
  FileCheck2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  Upload, 
  ChevronRight,
  Fingerprint,
  Calendar,
  Building,
  FileText
} from 'lucide-react';

interface PreSubmissionHealthCheckProps {
  currentCase: CitizenCase;
  onUpdateCase: (updatedCase: CitizenCase) => void;
}

export const PreSubmissionHealthCheck: React.FC<PreSubmissionHealthCheckProps> = ({
  currentCase,
  onUpdateCase
}) => {
  const [selectedRuleTrace, setSelectedRuleTrace] = useState<RuleTraceItem | null>(
    currentCase.ruleTraces.find(r => r.resultStatus === 'FAIL') || currentCase.ruleTraces[0] || null
  );

  const getStatusIcon = (status: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN') => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-[#2E7D57]" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-[#D99020]" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-[#B23A3A]" />;
      default:
        return <HelpCircle className="w-4 h-4 text-[#5B6B80]" />;
    }
  };

  const getStatusBadge = (status: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN') => {
    switch (status) {
      case 'PASS':
        return <RubberStamp variant="VERIFIED" size="sm" />;
      case 'WARNING':
        return <RubberStamp variant="ACTION_REQUIRED" label="WARNING" size="sm" />;
      case 'FAIL':
        return <RubberStamp variant="BLOCKED" label="BLOCKED" size="sm" />;
      default:
        return <RubberStamp variant="PENDING" label="UNKNOWN" size="sm" />;
    }
  };

  const hasFails = currentCase.ruleTraces.some(r => r.resultStatus === 'FAIL');

  return (
    <div className="space-y-6">
      {/* Top Health Readout & Instrument Bar */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px]">
        <div className="flex flex-wrap items-start justify-between border-b border-[#DCE5ED] pb-3 mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] text-[#123B63] font-bold tracking-widest uppercase">
                JOURNEY A // PRE-SUBMISSION CALIBRATION
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                DEMO DATA // SYNTHETIC CITIZEN
              </span>
            </div>
            <h2 className="font-display font-[800] text-2xl text-[#0C2A47] tracking-tight mt-1">
              Statutory Pre-Submission Health Check
            </h2>
            <p className="text-sm text-[#5B6B80] mt-0.5">
              Cross-document verification engine prevents rejections before application filing.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <MechanicalOdometer
              value={currentCase.readinessPercentage}
              label="APPLICATION READINESS"
              size="md"
            />
            {hasFails ? (
              <RubberStamp variant="BLOCKED" size="md" label="FILING BLOCKED" />
            ) : currentCase.readinessPercentage >= 90 ? (
              <RubberStamp variant="VERIFIED" size="md" label="READY TO SUBMIT" />
            ) : (
              <RubberStamp variant="ACTION_REQUIRED" size="md" label="ATTENTION REQ" />
            )}
          </div>
        </div>

        {/* Hazard warning banner if blocked */}
        {hasFails && (
          <div className="mb-4">
            <WarningHatch variant="red">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#B23A3A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-display font-[800] text-sm text-[#B23A3A] uppercase tracking-wide">
                    DO NOT SUBMIT THIS APPLICATION YET — PREVENTABLE CLERICAL REJECTION IDENTIFIED
                  </h4>
                  <p className="text-xs text-[#17212B] leading-relaxed">
                    Our deterministic rules caught data discrepancies across your documents. Filing right now will trigger an administrative rejection. <strong>Fix this before submitting</strong> by resolving the highlighted discrepancies below first.
                  </p>
                </div>
              </div>
            </WarningHatch>
          </div>
        )}

        {/* Visual Instruments & Documents Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          
          {/* Left Column: Documents Inspected (4 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-1.5">
              <span className="font-mono-tech text-[11px] font-bold text-[#0C2A47] uppercase tracking-wider">
                INSPECTED DOCUMENTS ({currentCase.documents.length})
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                OCR EXTRACTED
              </span>
            </div>

            <div className="space-y-2">
              {currentCase.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#F7FAFC] border border-[#DCE5ED] p-3 rounded-[2px] hover:border-[#123B63] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {doc.docType === 'AADHAAR' && <Fingerprint className="w-4 h-4 text-[#123B63]" />}
                      {doc.docType === 'BANK_PASSBOOK' && <Building className="w-4 h-4 text-[#123B63]" />}
                      {doc.docType !== 'AADHAAR' && doc.docType !== 'BANK_PASSBOOK' && <FileText className="w-4 h-4 text-[#123B63]" />}
                      <span className="font-display font-bold text-xs text-[#0C2A47]">
                        {doc.name}
                      </span>
                    </div>
                    <RubberStamp variant="VERIFIED" size="sm" />
                  </div>

                  <div className="mt-2 text-xs space-y-0.5 text-[#5B6B80] font-mono-tech">
                    {doc.holderName && (
                      <div>NAME: <strong className="text-[#17212B]">{doc.holderName}</strong></div>
                    )}
                    {doc.dob && (
                      <div>DOB: <strong className="text-[#17212B]">{doc.dob}</strong></div>
                    )}
                    {doc.number && (
                      <div>REF: <strong className="text-[#17212B]">{doc.number}</strong></div>
                    )}
                    {doc.bankName && (
                      <div>BANK: <strong className="text-[#17212B]">{doc.bankName}</strong></div>
                    )}
                    {doc.ifsc && (
                      <div>IFSC: <strong className="text-[#17212B]">{doc.ifsc}</strong></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border border-dashed border-[#123B63] rounded-[2px] flex items-center justify-center gap-2 text-xs font-mono-tech text-[#123B63] cursor-pointer hover:bg-[#F7FAFC]">
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD ADDITIONAL STATUTORY DOCUMENT</span>
            </div>
          </div>

          {/* Right Column: Rule Trace Matrix & Precision Drawer (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-1.5">
              <span className="font-mono-tech text-[11px] font-bold text-[#0C2A47] uppercase tracking-wider">
                DETERMINISTIC RULE TRACE MATRIX
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                {currentCase.ruleTraces.length} CHECKS EVALUATED
              </span>
            </div>

            <div className="border border-[#DCE5ED] divide-y divide-[#DCE5ED] rounded-[2px] bg-white">
              {currentCase.ruleTraces.map((trace) => {
                const isSelected = selectedRuleTrace?.id === trace.id;
                return (
                  <div
                    key={trace.id}
                    onClick={() => setSelectedRuleTrace(trace)}
                    className={`p-3 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F7FAFC] border-l-4 border-l-[#123B63]'
                        : 'hover:bg-[#F7FAFC]/60 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getStatusIcon(trace.resultStatus)}</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech font-bold text-xs text-[#0C2A47]">
                            {trace.ruleName}
                          </span>
                          <span className="text-[10px] font-mono-tech text-[#5B6B80] bg-[#F7FAFC] px-1.5 py-0.2 border border-[#DCE5ED]">
                            {trace.resultCode}
                          </span>
                        </div>
                        <p className="text-xs text-[#17212B] font-medium">
                          {trace.summary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {getStatusBadge(trace.resultStatus)}
                      <ChevronRight className={`w-4 h-4 text-[#5B6B80] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Rule Inspection Drawer */}
            {selectedRuleTrace && (
              <div className="p-4 bg-[#F7FAFC] border-2 border-[#123B63] rounded-[2px] shadow-hard-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-[10px] font-bold text-[#123B63] uppercase">
                      INSPECTION TRACE // {selectedRuleTrace.ruleName}
                    </span>
                  </div>
                  {getStatusBadge(selectedRuleTrace.resultStatus)}
                </div>

                <div className="space-y-2 text-xs">
                  {selectedRuleTrace.ruleName.includes('MATCH') && selectedRuleTrace.resultStatus === 'FAIL' ? (
                    <div className="bg-white border-2 border-[#B23A3A] p-4 rounded-[2px] mt-4 space-y-4">
                      <div className="text-center font-display font-[800] text-[#B23A3A] tracking-wider border-b border-[#DCE5ED] pb-2">
                        DOCUMENT CROSS-CHECK
                      </div>
                      
                      <div className="flex justify-between text-xs font-mono-tech bg-[#F7FAFC] p-3 border border-[#DCE5ED]">
                        <div className="flex-1 text-center border-r border-[#DCE5ED]">
                          <div className="text-[#5B6B80] mb-1">{selectedRuleTrace.testedDocuments[0] || 'SOURCE A'}</div>
                          <div className="font-bold text-[#0C2A47] text-sm">
                            {selectedRuleTrace.detail.split(' vs ')[0]?.split(': ')[1]?.replace(/"/g, '') || '-'}
                          </div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-[#5B6B80] mb-1">{selectedRuleTrace.testedDocuments[1] || 'SOURCE B'}</div>
                          <div className="font-bold text-[#0C2A47] text-sm">
                            {selectedRuleTrace.detail.split(' vs ')[1]?.split(': ')[1]?.replace(/"/g, '') || '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 text-[#B23A3A] font-display font-[800] text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        {selectedRuleTrace.summary.toUpperCase()}
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-b border-[#DCE5ED] py-3 text-xs font-mono-tech">
                        <div className="text-center">
                          <div className="text-[#5B6B80]">SEVERITY</div>
                          <div className="font-bold text-[#B23A3A]">HIGH</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[#5B6B80]">STATUS</div>
                          <div className="font-bold text-[#B23A3A]">ACTION REQUIRED</div>
                        </div>
                      </div>

                      <div className="bg-[#FEF7EA] p-3 border border-[#F4B942]">
                        <div className="font-display font-[800] text-[#D99020] text-[11px] uppercase mb-1">
                          WHY THIS MATTERS
                        </div>
                        <p className="text-xs text-[#17212B]">
                          These records contain different {selectedRuleTrace.ruleName.split('_')[0].toLowerCase()}s.
                          <br />
                          {selectedRuleTrace.remedyRequired}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-mono-tech text-[10px] text-[#5B6B80] block">AUDIT DETAIL:</span>
                        <p className="text-[#17212B] font-medium leading-relaxed">
                          {selectedRuleTrace.detail}
                        </p>
                      </div>

                      <div>
                        <span className="font-mono-tech text-[10px] text-[#5B6B80] block">MATHEMATICAL / RECORD EVIDENCE:</span>
                        <p className="font-mono-tech text-[11px] text-[#0C2A47] bg-white p-2 border border-[#DCE5ED] rounded-[2px]">
                          {selectedRuleTrace.evidence}
                        </p>
                      </div>

                      {selectedRuleTrace.remedyRequired && (
                        <div className="bg-[#FEF7EA] border border-[#F4B942] p-2.5 rounded-[2px]">
                          <span className="font-display font-[800] text-[11px] text-[#D99020] uppercase block">
                            REQUIRED PRE-SUBMISSION REMEDY:
                          </span>
                          <p className="text-xs text-[#17212B] mt-0.5">
                            {selectedRuleTrace.remedyRequired}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
