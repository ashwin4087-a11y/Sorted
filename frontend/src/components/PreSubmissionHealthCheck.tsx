import React, { useState, useEffect } from 'react';
import { CitizenCase, RuleTraceItem } from '../types';
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
import { runHealthCheck, uploadDocument } from '../services/api';

interface PreSubmissionHealthCheckProps {
  currentCase: CitizenCase;
  onUpdateCase: (updatedCase: CitizenCase) => void;
}

export const PreSubmissionHealthCheck: React.FC<PreSubmissionHealthCheckProps> = ({
  currentCase,
  onUpdateCase
}) => {
  const [apiData, setApiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We will map API issues to the selected item for inspection drawer
  const [selectedIssue, setSelectedIssue] = useState<any>(null);

  useEffect(() => {
    async function fetchHealthCheck() {
      setIsLoading(true);
      setApiError(null);
      try {
        // Use real app id from the case
        const appId = currentCase.id.length > 20 ? currentCase.id : "00000000-0000-0000-0000-000000000000"; // Fallback to demo if local fake ID
        const result = await runHealthCheck(appId);
        setApiData(result);
        if (result.issues_found && result.issues_found.length > 0) {
          setSelectedIssue(result.issues_found[0]);
        }
      } catch (err: any) {
        setApiError('Unable to load the application. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHealthCheck();
  }, [currentCase.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // We should ideally pass real citizen_id from the case, assuming the demo one here
    const citizenId = "00000000-0000-0000-0000-000000000000";
    
    setIsLoading(true);
    try {
      // Create a temporary input component or just use fetch directly
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        headers: {
          'x-citizen-id': citizenId
        },
        body: formData
      });
      if (response.ok) {
        const doc = await response.json();
        alert(`Document uploaded successfully: ${doc.filename}`);
        // Optionally run extraction here:
        // await extractDocument(doc.id);
        
        // Add to currentCase documents
        onUpdateCase({
          ...currentCase,
          documents: [
            ...currentCase.documents,
            {
              id: doc.id,
              name: doc.filename,
              docType: 'OTHER',
              url: ''
            }
          ]
        });
      } else {
        alert("Upload failed. Make sure backend is running.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback to local demo data ONLY if API data isn't loaded (so UI layout doesn't completely break while loading)
  // But we want to show the error if it fails.
  const hasFails = apiData ? apiData.overall_status !== 'HEALTHY' : currentCase.ruleTraces.some(r => r.resultStatus === 'FAIL');
  const readiness = apiData ? (apiData.overall_status === 'HEALTHY' ? 100 : 40) : currentCase.readinessPercentage;
  
  const issuesToDisplay = apiData ? (apiData.issues_found || []) : currentCase.ruleTraces.filter(r => r.resultStatus === 'FAIL');
  const allChecksToDisplay = apiData ? (apiData.issues_found || []) : currentCase.ruleTraces; // Ideally we'd show passing checks too, but API currently returns only issues or we map them.

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'HEALTHY':
        return <CheckCircle2 className="w-4 h-4 text-[#2E7D57]" />;
      case 'WARNING':
      case 'MINOR_MISMATCH':
        return <AlertTriangle className="w-4 h-4 text-[#D99020]" />;
      case 'FAIL':
      case 'MAJOR_MISMATCH':
        return <XCircle className="w-4 h-4 text-[#B23A3A]" />;
      default:
        return <HelpCircle className="w-4 h-4 text-[#5B6B80]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'HEALTHY':
        return <RubberStamp variant="VERIFIED" size="sm" />;
      case 'WARNING':
      case 'MINOR_MISMATCH':
        return <RubberStamp variant="ACTION_REQUIRED" label="WARNING" size="sm" />;
      case 'FAIL':
      case 'MAJOR_MISMATCH':
        return <RubberStamp variant="BLOCKED" label="BLOCKED" size="sm" />;
      default:
        return <RubberStamp variant="PENDING" label="UNKNOWN" size="sm" />;
    }
  };

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-[#FDF2F2] border border-[#F2CDCD] p-4 rounded-[2px] mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B23A3A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-display font-[800] text-sm text-[#B23A3A] uppercase tracking-wide">
                API CONNECTION ERROR
              </h4>
              <p className="text-xs text-[#17212B] leading-relaxed">
                {apiError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Health Readout & Instrument Bar */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px]">
        <div className="flex flex-wrap items-start justify-between border-b border-[#DCE5ED] pb-3 mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] text-[#123B63] font-bold tracking-widest uppercase">
                JOURNEY A // PRE-SUBMISSION CALIBRATION
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                {apiData ? 'LIVE BACKEND DATA' : 'DEMO DATA // SYNTHETIC CITIZEN'}
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
              value={readiness}
              label="APPLICATION READINESS"
              size="md"
            />
            {hasFails ? (
              <RubberStamp variant="BLOCKED" size="md" label="FILING BLOCKED" />
            ) : readiness >= 90 ? (
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

            <label className="p-3 bg-white border border-dashed border-[#123B63] rounded-[2px] flex items-center justify-center gap-2 text-xs font-mono-tech text-[#123B63] cursor-pointer hover:bg-[#F7FAFC]">
              <input type="file" className="hidden" onChange={handleUpload} />
              <Upload className="w-3.5 h-3.5" />
              <span>UPLOAD ADDITIONAL STATUTORY DOCUMENT</span>
            </label>
          </div>

          {/* Right Column: Rule Trace Matrix & Precision Drawer (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-1.5">
              <span className="font-mono-tech text-[11px] font-bold text-[#0C2A47] uppercase tracking-wider">
                DETERMINISTIC RULE TRACE MATRIX
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                {allChecksToDisplay.length} CHECKS EVALUATED
              </span>
            </div>

            <div className="border border-[#DCE5ED] divide-y divide-[#DCE5ED] rounded-[2px] bg-white">
              {allChecksToDisplay.map((trace: any, idx: number) => {
                const traceId = trace.id || `issue-${idx}`;
                const isSelected = selectedIssue ? (selectedIssue.id === traceId || selectedIssue === trace) : (!selectedIssue && idx === 0);
                const ruleName = trace.ruleName || trace.field || 'MISMATCH';
                const resultStatus = trace.resultStatus || (trace.severity === 'MAJOR_MISMATCH' ? 'FAIL' : 'WARNING');
                const summary = trace.summary || `${trace.document_a} vs ${trace.document_b}`;

                return (
                  <div
                    key={traceId}
                    onClick={() => setSelectedIssue(trace)}
                    className={`p-3 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#F7FAFC] border-l-4 border-l-[#123B63]'
                        : 'hover:bg-[#F7FAFC]/60 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getStatusIcon(resultStatus)}</div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tech font-bold text-xs text-[#0C2A47] uppercase">
                            {ruleName}
                          </span>
                        </div>
                        <p className="text-xs text-[#17212B] font-medium">
                          {summary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {getStatusBadge(resultStatus)}
                      <ChevronRight className={`w-4 h-4 text-[#5B6B80] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Rule Inspection Drawer */}
            {selectedIssue && (
              <div className="p-4 bg-[#F7FAFC] border-2 border-[#123B63] rounded-[2px] shadow-hard-sm space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tech text-[10px] font-bold text-[#123B63] uppercase">
                      INSPECTION TRACE // {selectedIssue?.field || selectedIssue?.ruleName}
                    </span>
                  </div>
                  {getStatusBadge(selectedIssue?.severity === 'MAJOR_MISMATCH' ? 'FAIL' : (selectedIssue?.resultStatus || 'WARNING'))}
                </div>

                <div className="space-y-2 text-xs">
                  {/* Unified display for API mismatch format or local trace format */}
                  <div className="bg-white border-2 border-[#B23A3A] p-4 rounded-[2px] mt-4 space-y-4">
                    <div className="text-center font-display font-[800] text-[#B23A3A] tracking-wider border-b border-[#DCE5ED] pb-2">
                      DOCUMENT CROSS-CHECK
                    </div>
                    
                    <div className="flex justify-between text-xs font-mono-tech bg-[#F7FAFC] p-3 border border-[#DCE5ED]">
                      <div className="flex-1 text-center border-r border-[#DCE5ED]">
                        <div className="text-[#5B6B80] mb-1">{selectedIssue?.document_a || selectedIssue?.testedDocuments?.[0] || 'SOURCE A'}</div>
                        <div className="font-bold text-[#0C2A47] text-sm break-words">
                          {selectedIssue?.value_a || (selectedIssue?.detail?.split(' vs ')[0]?.split(': ')[1]?.replace(/"/g, '')) || '-'}
                        </div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="text-[#5B6B80] mb-1">{selectedIssue?.document_b || selectedIssue?.testedDocuments?.[1] || 'SOURCE B'}</div>
                        <div className="font-bold text-[#0C2A47] text-sm break-words">
                          {selectedIssue?.value_b || (selectedIssue?.detail?.split(' vs ')[1]?.split(': ')[1]?.replace(/"/g, '')) || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[#B23A3A] font-display font-[800] text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {selectedIssue?.severity || 'MISMATCH DETECTED'}
                    </div>

                    <div className="bg-[#FEF7EA] p-3 border border-[#F4B942]">
                      <div className="font-display font-[800] text-[#D99020] text-[11px] uppercase mb-1">
                        RECOMMENDED ACTION
                      </div>
                      <p className="text-xs text-[#17212B]">
                        {selectedIssue?.recommended_action || selectedIssue?.remedyRequired || 'Resolve mismatch before submitting.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
