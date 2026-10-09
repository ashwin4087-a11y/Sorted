import React, { useState } from 'react';
import { CitizenCase, DiagnosisResult, getResolutionProgress, getStatusColor } from '../types';
import { RubberStamp } from './RubberStamp';
import { WarningHatch } from './WarningHatch';
import { AnalogGauge } from './AnalogGauge';
import { MechanicalOdometer } from './MechanicalOdometer';
import { PFMS_TAXONOMY } from '../data/pfmsTaxonomy';
import { 
  AlertOctagon, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  MapPin, 
  Building, 
  HelpCircle,
  ExternalLink,
  Search,
  BookOpen
} from 'lucide-react';

interface DBTFailureDiagnoserProps {
  currentCase: CitizenCase;
  onUpdateCase: (updatedCase: CitizenCase) => void;
  onTriggerDiagnosis: (errorText: string) => void;
  onSelectLetterTab: () => void;
}

export const DBTFailureDiagnoser: React.FC<DBTFailureDiagnoserProps> = ({
  currentCase,
  onUpdateCase,
  onTriggerDiagnosis,
  onSelectLetterTab
}) => {
  const [showTaxonomyBrowser, setShowTaxonomyBrowser] = useState(false);
  const [taxonomySearch, setTaxonomySearch] = useState('');

  const diagnosis = currentCase.diagnosis;

  const filteredTaxonomy = PFMS_TAXONOMY.filter(t => 
    t.id.toLowerCase().includes(taxonomySearch.toLowerCase()) ||
    t.reason.toLowerCase().includes(taxonomySearch.toLowerCase()) ||
    t.stage.toLowerCase().includes(taxonomySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Instrument Card */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px]">
        <div className="flex flex-wrap items-start justify-between border-b border-[#DCE5ED] pb-3 mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-[10px] text-[#123B63] font-bold tracking-widest uppercase">
                JOURNEY B // POST-SUBMISSION RESOLUTION
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                PFMS OFFICIAL ERROR TAXONOMY v1.0
              </span>
            </div>
            <h2 className="font-display font-[800] text-2xl text-[#0C2A47] tracking-tight mt-1">
              DBT Payment Failure Diagnostic Instrument
            </h2>
            <p className="text-sm text-[#5B6B80] mt-0.5">
              Identifies statutory disbursement blockers and compiles official remedies.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <MechanicalOdometer
              value={getResolutionProgress(currentCase.status)}
              label="CASE RESOLUTION"
              size="md"
              statusText={currentCase.status.replace(/_/g, ' ')}
              statusColor={getStatusColor(currentCase.status)}
            />
            <RubberStamp variant="ACTION_REQUIRED" size="md" label="BLOCKED AT BANK" />
          </div>
        </div>

        {/* 1. CURRENT BLOCKER (Section 29: with physical hazard hatching) */}
        {diagnosis && (
          <div className="mb-5">
            <WarningHatch variant={diagnosis.isUnknownReason ? 'amber' : 'red'}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-[#B23A3A] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech font-bold text-xs bg-[#B23A3A] text-white px-1.5 py-0.5 rounded-[1px]">
                        CODE: {diagnosis.code}
                      </span>
                      <span className="font-mono-tech text-[11px] text-[#5B6B80]">
                        STAGE: {diagnosis.stage}
                      </span>
                    </div>
                    <h3 className="font-display font-[800] text-lg text-[#0C2A47] tracking-tight">
                      {diagnosis.title}
                    </h3>
                    <p className="text-xs text-[#17212B] leading-relaxed">
                      <strong>Remedy:</strong> {diagnosis.remedy}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono-tech text-[#5B6B80]">CONFIDENCE:</span>
                    <RubberStamp variant="USER_CONFIRMED" label={diagnosis.confidence} size="sm" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                    DESTINATION: <strong className="text-[#123B63]">{diagnosis.destination.toUpperCase()}</strong>
                  </span>
                </div>
              </div>
            </WarningHatch>
          </div>
        )}

        {/* 2. NEXT ACTION & EVIDENCE QUADRANT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Immediate Action Plan (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-[#123B63] bg-[#F7FAFC] p-4 rounded-[2px]">
              <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-2 mb-3">
                <span className="font-display font-[800] text-xs text-[#0C2A47] uppercase tracking-wider">
                  STATUTORY RESOLUTION ACTION
                </span>
                <RubberStamp variant="ACTION_REQUIRED" size="sm" />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-[2px] bg-[#123B63] text-white font-mono-tech font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-[#0C2A47]">
                      {diagnosis?.nextAction || 'Visit Home Bank Branch with Aadhaar Seeding Consent Form'}
                    </h4>
                    <p className="text-xs text-[#5B6B80] leading-relaxed">
                      Banks frequently update KYC in CBS without linking the account to the NPCI DBT mapper. Presenting our formal requisition letter forces the clerk to register the mandate.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#DCE5ED] p-3 rounded-[2px] space-y-2">
                  <span className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase block">
                    MANDATORY PHYSICAL CHECKLIST (WHAT TO CARRY):
                  </span>
                  <ul className="text-xs space-y-1 text-[#17212B]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                      <span>Original Aadhaar Card + 2 self-attested copies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                      <span>Original Canara Bank Passbook (A/C: 1204XXXX89234)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                      <span>PM-KISAN Sanction Slip (Ref: TN-PMK-2026-99042)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                      <span>SORTED Generated Draft Request Letter</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={onSelectLetterTab}
                    className="btn-instrument bg-[#123B63] text-white px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>VIEW & PRINT GENERATED DRAFT REQUEST LETTER</span>
                  </button>

                  <button
                    onClick={() => setShowTaxonomyBrowser(!showTaxonomyBrowser)}
                    className="text-xs font-mono-tech text-[#123B63] hover:underline flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>INSPECT 26-ROW PFMS TAXONOMY</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostic Evidence & Provenance */}
            <div className="border border-[#DCE5ED] bg-white p-3.5 rounded-[2px] space-y-2">
              <span className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase block">
                DIAGNOSTIC PROVENANCE & RECORD EVIDENCE
              </span>
              <div className="text-xs space-y-1 font-mono-tech text-[#17212B]">
                <div>SOURCE DOC: <strong className="text-[#123B63]">{diagnosis?.evidenceSource}</strong></div>
                <div>OFFICIAL CITATION: <span className="text-[#5B6B80]">{diagnosis?.taxonomySource}</span></div>
                <div>RECORD EVIDENCE: <span className="text-[#0C2A47]">{diagnosis?.evidence}</span></div>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Analog Gauge & Fast Test Simulator (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col items-center">
            <AnalogGauge
              currentValue={currentCase.readinessPercentage}
              targetValue={100}
              label="DISBURSEMENT INTEGRITY"
              size={240}
              className="w-full"
            />

            {/* Interactive Failure Code Simulator */}
            <div className="w-full bg-[#F7FAFC] border border-[#DCE5ED] p-3 rounded-[2px] space-y-2">
              <span className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase block">
                TEST ANOTHER PFMS FAILURE SCENARIO:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono-tech">
                <button
                  onClick={() => onTriggerDiagnosis('P-U1: Aadhaar de-seeded in NPCI')}
                  className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-1.5 text-left rounded-[1px]"
                >
                  <strong>P-U1</strong>: Aadhaar De-seeded
                </button>
                <button
                  onClick={() => onTriggerDiagnosis('V-A2: Invalid IFSC branch merged')}
                  className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-1.5 text-left rounded-[1px]"
                >
                  <strong>V-A2</strong>: Invalid IFSC
                </button>
                <button
                  onClick={() => onTriggerDiagnosis('V-A6: Validation pending 6 months KYC')}
                  className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-1.5 text-left rounded-[1px]"
                >
                  <strong>V-A6</strong>: KYC Pending
                </button>
                <button
                  onClick={() => onTriggerDiagnosis('No failure code provided by portal (UNKNOWN)')}
                  className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-1.5 text-left rounded-[1px]"
                >
                  <strong>UNKNOWN</strong>: Reason Missing
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 3. PFMS TAXONOMY AUDIT BROWSER (EXPANDABLE) */}
        {showTaxonomyBrowser && (
          <div className="mt-6 border-2 border-[#123B63] bg-white p-4 rounded-[2px] shadow-hard space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-[#DCE5ED] pb-2 gap-2">
              <div>
                <h4 className="font-display font-[800] text-sm text-[#0C2A47] uppercase">
                  OFFICIAL PFMS REJECTION & REMEDY AUDIT TABLE (26 ENTRIES)
                </h4>
                <p className="text-xs text-[#5B6B80]">
                  Grounded in official Public Financial Management System DBT guidelines.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#5B6B80]" />
                  <input
                    type="text"
                    value={taxonomySearch}
                    onChange={(e) => setTaxonomySearch(e.target.value)}
                    placeholder="Search code or reason..."
                    className="pl-7 pr-2 py-1 text-xs border border-[#123B63] rounded-[2px] font-mono-tech"
                  />
                </div>
                <button
                  onClick={() => setShowTaxonomyBrowser(false)}
                  className="text-xs font-mono-tech text-[#B23A3A] font-bold px-2 py-1 border border-[#DCE5ED] hover:bg-[#FDF2F2]"
                >
                  CLOSE
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto border border-[#DCE5ED] rounded-[2px]">
              <table className="w-full text-left text-xs font-mono-tech divide-y divide-[#DCE5ED]">
                <thead className="bg-[#0C2A47] text-white text-[10px] sticky top-0 uppercase">
                  <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Stage</th>
                    <th className="p-2">Reason</th>
                    <th className="p-2">Remedy</th>
                    <th className="p-2">Responsible</th>
                    <th className="p-2">Destination</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE5ED] bg-white">
                  {filteredTaxonomy.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F7FAFC]">
                      <td className="p-2 font-bold text-[#123B63] whitespace-nowrap">{row.id}</td>
                      <td className="p-2 text-[#5B6B80] whitespace-nowrap">{row.stage}</td>
                      <td className="p-2 text-[#17212B] font-medium">{row.reason}</td>
                      <td className="p-2 text-[#2E7D57]">{row.remedy}</td>
                      <td className="p-2 text-[#5B6B80] whitespace-nowrap">{row.responsible}</td>
                      <td className="p-2 font-bold whitespace-nowrap">{row.destination}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            onTriggerDiagnosis(`${row.id}: ${row.reason}`);
                            setShowTaxonomyBrowser(false);
                          }}
                          className="px-2 py-0.5 bg-[#123B63] text-white text-[10px] font-bold rounded-[1px] hover:bg-[#0C2A47]"
                        >
                          APPLY
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
