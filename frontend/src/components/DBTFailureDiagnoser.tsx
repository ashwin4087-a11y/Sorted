import React, { useState } from 'react';
import { CitizenCase, getResolutionProgress, getStatusColor } from '../types';
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
  BookOpen,
  Play
} from 'lucide-react';
import { startPaymentDiagnosis, answerDiagnosisQuestion } from '../services/api';

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

  // New state for API integration
  const [apiCaseId, setApiCaseId] = useState<string | null>(null);
  const [apiQuestion, setApiQuestion] = useState<string | null>(null);
  const [apiQuestionKey, setApiQuestionKey] = useState<string | null>(null); // To send back answer
  const [apiGuidance, setApiGuidance] = useState<string | null>(null);
  const [apiDiagnosis, setApiDiagnosis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const diagnosis = currentCase.diagnosis;

  const filteredTaxonomy = PFMS_TAXONOMY.filter(t => 
    t.id.toLowerCase().includes(taxonomySearch.toLowerCase()) ||
    t.reason.toLowerCase().includes(taxonomySearch.toLowerCase()) ||
    t.stage.toLowerCase().includes(taxonomySearch.toLowerCase())
  );

  const startDiagnosis = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Use dummy ID for demo since backend lacks seed data
      const dummyCitizenId = "00000000-0000-0000-0000-000000000000"; 
      const response = await startPaymentDiagnosis({ citizen_id: dummyCitizenId, reported_problem: "Payment failed" });
      setApiCaseId(response.case_id);
      setApiQuestion(response.question);
      // We assume question string is the key for now since the schema doesn't separate them cleanly.
      // Wait, in payment_diagnosis.py the key isn't sent separately in the schema. We'll just send the question back.
      setApiQuestionKey(response.question);
      setApiGuidance(response.guidance);
      setApiDiagnosis(response.diagnosis ? response : null);
    } catch (err: any) {
      setApiError(err.message || 'Unable to start diagnosis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const answerQuestion = async (answer: string) => {
    if (!apiCaseId || !apiQuestionKey) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await answerDiagnosisQuestion(apiCaseId, apiQuestionKey, answer);
      setApiQuestion(response.question);
      setApiQuestionKey(response.question);
      setApiGuidance(response.guidance);
      if (response.diagnosis) {
         setApiDiagnosis(response);
      }
    } catch (err: any) {
      setApiError(err.message || 'Unable to submit answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Instrument Card */}
      <div className="bg-white border border-[#123B63] shadow-hard p-5 rounded-[2px]">
        <div className="flex flex-wrap items-start justify-between border-b border-[#DCE5ED] pb-3 mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-technical text-[#123B63] font-bold uppercase">
                JOURNEY B // POST-SUBMISSION RESOLUTION
              </span>
              <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                PFMS OFFICIAL ERROR TAXONOMY v1.0
              </span>
            </div>
            <h2 className="text-page-heading text-[#0C2A47] mt-1">
              DBT Payment Failure Diagnostic Instrument
            </h2>
            <p className="text-supporting mt-0.5">
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

        {/* 1. CURRENT BLOCKER */}
        {(diagnosis || apiDiagnosis) && (
          <div className="mb-5">
            <WarningHatch variant={(diagnosis?.isUnknownReason || apiDiagnosis?.failure_code === 'UNKNOWN') ? 'amber' : 'red'}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-[#B23A3A] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech font-bold text-xs bg-[#B23A3A] text-white px-1.5 py-0.5 rounded-[1px]">
                        CODE: {apiDiagnosis ? apiDiagnosis.failure_code : diagnosis?.code}
                      </span>
                      <span className="font-mono-tech text-[11px] text-[#5B6B80]">
                        STAGE: {apiDiagnosis ? apiDiagnosis.status : diagnosis?.stage}
                      </span>
                    </div>
                    <h3 className="text-component-heading text-[#0C2A47]">
                      {apiDiagnosis ? apiDiagnosis.reason : diagnosis?.title}
                    </h3>
                    <p className="text-body text-[#17212B]">
                      <strong>Remedy:</strong> {apiDiagnosis ? apiDiagnosis.remedy : diagnosis?.remedy}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono-tech text-[#5B6B80]">CONFIDENCE:</span>
                    <RubberStamp variant="USER_CONFIRMED" label={apiDiagnosis ? (apiDiagnosis.confidence > 0.8 ? 'HIGH' : 'MEDIUM') : diagnosis?.confidence} size="sm" />
                  </div>
                  <span className="text-[10px] font-mono-tech text-[#5B6B80]">
                    DESTINATION: <strong className="text-[#123B63]">{apiDiagnosis ? 'BANK' : diagnosis?.destination.toUpperCase()}</strong>
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
                      {apiDiagnosis ? apiDiagnosis.next_action : (diagnosis?.nextAction || 'Visit Home Bank Branch with Aadhaar Seeding Consent Form')}
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
                    {(apiDiagnosis?.required_documents || ['Original Aadhaar Card + 2 self-attested copies', 'Original Canara Bank Passbook']).map((doc: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#56A67A] shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
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
                <div>SOURCE DOC: <strong className="text-[#123B63]">{apiDiagnosis ? 'Backend API' : diagnosis?.evidenceSource}</strong></div>
                <div>OFFICIAL CITATION: <span className="text-[#5B6B80]">{apiDiagnosis ? apiDiagnosis.source_reference : diagnosis?.taxonomySource}</span></div>
                <div>RECORD EVIDENCE: <span className="text-[#0C2A47]">{apiDiagnosis ? apiDiagnosis.diagnosis : diagnosis?.evidence}</span></div>
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

            {/* Interactive Payment Diagnosis Flow */}
            <div className="w-full bg-[#F7FAFC] border border-[#DCE5ED] p-3 rounded-[2px] space-y-2">
              <span className="font-mono-tech text-[10px] text-[#5B6B80] font-bold uppercase block">
                INTERACTIVE DIAGNOSIS:
              </span>
              
              {apiError && (
                <div className="text-xs bg-[#FDF2F2] text-[#B23A3A] border border-[#F2CDCD] p-2 rounded">
                  {apiError}
                </div>
              )}

              {!apiCaseId && !apiDiagnosis && (
                <button
                  onClick={startDiagnosis}
                  disabled={isLoading}
                  className="w-full bg-[#123B63] text-white px-3 py-2 text-xs font-bold rounded-[1px] flex justify-center items-center gap-2 hover:bg-[#0C2A47] disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> {isLoading ? 'STARTING...' : 'START DIAGNOSIS'}
                </button>
              )}

              {apiQuestion && !apiDiagnosis && (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0C2A47]">{apiQuestion}</p>
                  
                  {apiGuidance && (
                    <p className="text-xs text-[#5B6B80] italic">{apiGuidance}</p>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => answerQuestion('yes')}
                      disabled={isLoading}
                      className="flex-1 bg-white border border-[#DCE5ED] hover:border-[#123B63] py-1.5 text-xs font-bold rounded-[1px]"
                    >
                      Yes
                    </button>
                    <button 
                      onClick={() => answerQuestion('no')}
                      disabled={isLoading}
                      className="flex-1 bg-white border border-[#DCE5ED] hover:border-[#123B63] py-1.5 text-xs font-bold rounded-[1px]"
                    >
                      No
                    </button>
                    <button 
                      onClick={() => answerQuestion('unknown')}
                      disabled={isLoading}
                      className="flex-1 bg-white border border-[#DCE5ED] hover:border-[#123B63] py-1.5 text-xs font-bold rounded-[1px]"
                    >
                      I don't know
                    </button>
                  </div>
                </div>
              )}

              {apiDiagnosis && (
                <div className="text-xs text-[#2E7D57] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Diagnosis Complete
                </div>
              )}
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
