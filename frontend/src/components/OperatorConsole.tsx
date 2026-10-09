import React, { useState } from 'react';
import { CitizenCase, ExtractedFact, ProvenanceType } from '../types';
import { RubberStamp } from './RubberStamp';
import { Send, HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { agentChat } from '../services/api';

interface OperatorConsoleProps {
  currentCase: CitizenCase;
  onUpdateCase: (updatedCase: CitizenCase) => void;
  onTriggerDiagnosis: (errorText: string) => void;
}

export const OperatorConsole: React.FC<OperatorConsoleProps> = ({
  currentCase,
  onUpdateCase,
  onTriggerDiagnosis
}) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta'>(currentCase.language);
  const [showWhyExplain, setShowWhyExplain] = useState(false);

  // Suggested quick prompts representing real citizen questions/complaints
  const quickPrompts = selectedLanguage === 'ta' ? [
    { label: 'ரூபாய் வரவில்லை (P-U1 ஆதார் பிழை)', text: 'எனது பிஎம் கிசான் விண்ணப்பம் ஏற்கப்பட்டது, ஆனால் 2 தவணை பணம் வரவில்லை. ஆதார் NPCI மேப்பரில் இல்லை (P-U1) என்று வருகிறது.' },
    { label: 'காரணம் தெரியவில்லை (UNKNOWN)', text: 'பணம் வரவில்லை என்று எஸ்.எம்.எஸ் வந்தது, ஆனால் எந்த பிழை குறியீடும் காட்டவில்லை. என்ன செய்வது?' },
    { label: 'வங்கிக் கணக்கு மூடப்பட்டது (P-A7)', text: 'பணம் செலுத்தப்பட்டது ஆனால் வங்கி நிராகரித்தது (Rejected by bank, account closed).' }
  ] : [
    { label: 'Payment Failed: Aadhaar de-seeded (P-U1)', text: 'My PM-KISAN application was approved, but the last 2 instalments failed with error: Aadhaar de-seeded in NPCI mapper (P-U1).' },
    { label: 'Payment Failed: Unknown PFMS Reason', text: 'My pension was approved 3 months ago, but no money has been credited and I do not have any rejection code.' },
    { label: 'Bank Validation: Invalid IFSC (V-A2)', text: 'Portal says DBT payment rejected due to invalid IFSC after branch merger.' }
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    setIsProcessing(true);
    // Defensive reset: if this case was already diagnosed/resolved, starting to type means a NEW case.
    let targetCase = currentCase;
    if (['ACTION_READY', 'RESOLVED', 'CITIZEN_ACTION_REQUIRED'].includes(currentCase.status)) {
      const newCaseId = `CASE_${Date.now()}`;
      targetCase = {
        ...currentCase,
        id: newCaseId,
        caseRef: `CASE-${Math.floor(Math.random() * 90000) + 10000}`,
        status: 'UNDERSTANDING',
        citizenName: 'Unknown Citizen',
        schemeName: 'Unspecified Benefit',
        documents: [],
        chatHistory: [],
        extractedFacts: [],
        diagnosis: undefined,
        actions: [],
        events: []
      };
    }

    // Add user message to chat history immediately
    const userMessage = { role: 'user' as const, content: text };
    const updatedChatHistory = [...(targetCase.chatHistory || []), userMessage];
    
    targetCase = {
      ...targetCase,
      chatHistory: updatedChatHistory
    };
    onUpdateCase(targetCase);

    try {
      let serverResponse: any = null;
      try {
        serverResponse = await agentChat({
          session_id: targetCase.id,
          message: text
        });
      } catch (err) {
        // Fallback handled locally if needed, but assuming server responds
      }

      if (serverResponse) {
        let updatedFacts = [...targetCase.extractedFacts];
        let newEvents = [...targetCase.events];

        if (serverResponse.extractedFacts && serverResponse.extractedFacts.length > 0) {
          serverResponse.extractedFacts.forEach((newFact: ExtractedFact) => {
            const existingFact = targetCase.extractedFacts.find(f => f.key === newFact.key);
            if (!existingFact || existingFact.value !== newFact.value) {
              updatedFacts = [...updatedFacts.filter(f => f.key !== newFact.key), { ...newFact, caseId: targetCase.id }];
              newEvents.push({
                id: `EV-OP-${Date.now()}-${newFact.key}`,
                caseId: targetCase.id,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                eventType: 'FACT_EXTRACTED',
                title: `Fact Extracted: ${newFact.label}`,
                description: `Citizen provided: "${newFact.value}" (${newFact.provenance})`,
                actor: 'SORTED_AI'
              });
            }
          });
        }

        const assistantMessage = { role: 'assistant' as const, content: serverResponse.reply || 'Processing...' };
        
        onUpdateCase({
          ...targetCase,
          extractedFacts: updatedFacts,
          events: newEvents,
          chatHistory: [...updatedChatHistory, assistantMessage]
        });

        if (serverResponse.readyForDiagnosis) {
          const failureReasonFact = updatedFacts.find(f => f.key === 'reported_reason');
          onTriggerDiagnosis(failureReasonFact ? failureReasonFact.value : text);
        }
      }

      setInputText('');
    } finally {
      setIsProcessing(false);
    }
  };

  const provenanceBadge = (prov: ProvenanceType) => {
    switch (prov) {
      case 'VERIFIED':
        return <RubberStamp variant="VERIFIED" size="sm" />;
      case 'USER_REPORTED':
        return <RubberStamp variant="USER_CONFIRMED" label="USER REPORTED" size="sm" />;
      case 'INFERRED':
        return <RubberStamp variant="PENDING" label="INFERRED" size="sm" />;
      case 'UNKNOWN':
      default:
        return <RubberStamp variant="BLOCKED" label="UNKNOWN" size="sm" />;
    }
  };

  return (
    <div className="bg-white border border-[#123B63] shadow-hard rounded-[2px] overflow-hidden flex flex-col font-body-gov h-full min-h-0">
      {/* Console Top Instrument Bar */}
      <div className="bg-[#0C2A47] text-[#E2EAF2] px-4 py-3 flex flex-wrap items-center justify-between border-b-2 border-[#123B63] gap-2">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#56A67A] rounded-[1px] animate-pulse" />
          <span className="text-technical text-[#E2EAF2] font-bold">
            OPERATOR CONSOLE // CITIZEN INTAKE & TRIAGE
          </span>
        </div>

        {/* Language switch */}
        <div className="flex items-center gap-1 bg-[#081D33] p-1 border border-[#061526] rounded-[2px]">
          <button
            onClick={() => {
              setSelectedLanguage('en');
              onUpdateCase({ ...currentCase, language: 'en' });
            }}
            className={`px-2 py-0.5 text-xs font-mono-tech font-bold transition-all rounded-[1px] ${
              selectedLanguage === 'en'
                ? 'bg-[#123B63] text-white'
                : 'text-[#5B6B80] hover:text-white'
            }`}
          >
            ENGLISH
          </button>
          <button
            onClick={() => {
              setSelectedLanguage('ta');
              onUpdateCase({ ...currentCase, language: 'ta' });
            }}
            className={`px-2 py-0.5 text-xs font-mono-tech font-bold transition-all rounded-[1px] ${
              selectedLanguage === 'ta'
                ? 'bg-[#123B63] text-white'
                : 'text-[#5B6B80] hover:text-white'
            }`}
          >
            தமிழ் (TAMIL)
          </button>
        </div>
      </div>

      {/* Main Console Quadrants per Section 28 Directive */}
      {/* Main Console Quadrants - 3 Column Layout */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto md:overflow-hidden">
        <div className="flex flex-col md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 md:h-full">
          
          {/* COLUMN 1: CITIZEN INPUT SECTION (Fixed Chat Layout) */}
          <div className="flex flex-col bg-white border border-[#DCE5ED] rounded-[2px] overflow-hidden min-h-0">
            <div className="shrink-0 flex items-center justify-between border-b border-[#DCE5ED] p-2 bg-[#F7FAFC]">
              <span className="text-technical text-[#0C2A47] font-bold uppercase">
                1. CITIZEN INPUT & STATEMENT
              </span>
              <span className="text-technical text-[#5B6B80]">
                CASE: {currentCase.caseRef}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
              {currentCase.chatHistory && currentCase.chatHistory.length > 0 ? (
                currentCase.chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] font-mono-tech text-[#5B6B80] mb-0.5">{msg.role === 'user' ? 'CITIZEN' : 'SORTED AI'}</span>
                    <div className={`text-sm px-3 py-2 rounded-[2px] max-w-[85%] ${msg.role === 'user' ? 'bg-[#123B63] text-white' : 'bg-[#F7FAFC] border border-[#DCE5ED] text-[#17212B]'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-sm font-mono-tech text-[#5B6B80]">
                  Awaiting intake conversation...
                </div>
              )}
            </div>

            <div className="shrink-0 p-3 bg-[#F7FAFC] border-t border-[#DCE5ED] flex flex-col gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  selectedLanguage === 'ta'
                    ? 'உங்கள் பிரச்சனை அல்லது வங்கி/PFMS எஸ்.எம்.எஸ் செய்தியை உள்ளிடவும்...'
                    : 'Describe your government benefit issue, or paste your PFMS / Bank SMS status...'
                }
                rows={2}
                className="w-full p-2 text-sm bg-white border border-[#123B63] rounded-[2px] font-body-gov focus:outline-none focus:ring-1 focus:ring-[#123B63]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="hidden xl:inline font-mono-tech text-[10px] text-[#5B6B80] uppercase">
                    SIMULATE:
                  </span>
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputText(p.text);
                        handleSend(p.text);
                      }}
                      className="text-[10px] font-mono-tech bg-white hover:bg-[#EBF7F0] hover:text-[#2E7D57] text-[#123B63] border border-[#DCE5ED] px-2 py-0.5 rounded-[2px] transition-colors"
                    >
                      {p.label.split(':')[0]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={isProcessing || !inputText.trim()}
                  className="btn-instrument bg-[#123B63] text-white px-3 py-1 text-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  {isProcessing ? (
                    <span>CALIBRATING...</span>
                  ) : (
                    <>
                      <span>SUBMIT</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2: DIAGNOSIS & FACTS */}
          <div className="flex flex-col gap-4 overflow-visible md:overflow-y-auto min-h-0 md:pr-1">
            <div className="shrink-0 bg-[#F7FAFC] border border-[#DCE5ED] p-3.5 rounded-[2px]">
              <div className="flex items-center justify-between border-b border-[#DCE5ED] pb-1.5 mb-2">
                <span className="text-technical text-[#0C2A47] font-bold uppercase">
                  2. SYSTEM ANALYSIS
                </span>
                <span className="text-technical text-[#56A67A] font-bold">
                  DETERMINISTIC
                </span>
              </div>
              {(!currentCase.diagnosis || currentCase.diagnosis.caseId !== currentCase.id) ? (
                <div className="text-sm text-[#5B6B80] font-mono-tech flex flex-col items-center justify-center py-4 text-center">
                  <span className="font-bold text-[#123B63] mb-1 uppercase">AWAITING DIAGNOSTIC EVIDENCE</span>
                  <span>Continue the conversation with SORTED AI to identify the issue.</span>
                </div>
              ) : (
                <p className="text-body text-[#17212B]">
                  {selectedLanguage === 'ta' && currentCase.diagnosis.code === 'P-U1' ? (
                    <>
                      <strong>நிலைப்பாடு:</strong> விண்ணப்பதாரர் <strong>{currentCase.citizenName}</strong> ({currentCase.schemeName}) அவர்களின் 
                      கட்டணம் நிறுத்தி வைக்கப்பட்டுள்ளதற்கான காரணம் கண்டறியப்பட்டது. 
                      இது PFMS வழியே திரும்பி அனுப்பப்பட்டுள்ளது.
                    </>
                  ) : (
                    <>
                      <strong>Diagnosis Summary:</strong> Applicant <strong>{currentCase.citizenName}</strong> for scheme <strong>{currentCase.schemeName}</strong> has encountered a documented payment return. 
                      The transaction failed under PFMS Code <strong>{currentCase.diagnosis.code}</strong> ({currentCase.diagnosis.title}). 
                      {currentCase.diagnosis.isUnknownReason 
                        ? ' Further investigation is required to identify the exact cause of failure.'
                        : ' This is a clerical bank-switch mapping status, not a rejection of statutory scheme eligibility.'}
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex flex-col min-h-0">
              <div className="shrink-0 flex items-center justify-between border-b border-[#DCE5ED] pb-1.5 mb-2.5">
                <span className="text-technical text-[#0C2A47] font-bold uppercase">
                  3. EXTRACTED FACTS
                </span>
                <span className="font-mono-tech text-[10px] text-[#5B6B80]">
                  TOTAL: {currentCase.extractedFacts.filter(f => f.caseId === currentCase.id).length}
                </span>
              </div>
              <div className="flex-1 border border-[#DCE5ED] divide-y divide-[#DCE5ED] bg-white rounded-[2px] overflow-y-auto min-h-[100px]">
                {currentCase.extractedFacts.filter(f => f.caseId === currentCase.id).length === 0 ? (
                  <div className="p-4 text-center text-xs font-mono-tech text-[#5B6B80]">
                    Only current facts will be shown here.
                  </div>
                ) : (
                  currentCase.extractedFacts.filter(f => f.caseId === currentCase.id).map((fact) => (
                    <div
                      key={fact.id}
                      className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#F7FAFC] transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-tech text-[10px] font-semibold text-[#123B63] truncate max-w-[150px]">
                            {fact.label}
                          </span>
                        </div>
                        <span className="font-display font-bold text-sm text-[#0C2A47] leading-tight">
                          {fact.value}
                        </span>
                      </div>
                      <div className="flex items-center self-start sm:self-auto shrink-0 mt-1 sm:mt-0">
                        {provenanceBadge(fact.provenance)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: RESOLUTION */}
          <div className="flex flex-col gap-4 overflow-visible md:overflow-y-auto min-h-0 md:pr-1">
            <div className="shrink-0 bg-[#FEF7EA] border border-[#F4B942] p-3.5 rounded-[2px]">
              <div className="flex items-center justify-between border-b border-[#F4B942]/60 pb-1.5 mb-2">
                <span className="font-display font-[800] text-xs text-[#D99020] tracking-wider uppercase">
                  4. NEXT REQUIRED ACTION
                </span>
                {(!currentCase.actions || currentCase.actions.length === 0 || currentCase.actions[0].caseId !== currentCase.id) ? null : (
                  <button
                    onClick={() => setShowWhyExplain(!showWhyExplain)}
                    className="text-[9px] font-mono-tech text-[#123B63] underline flex items-center gap-1 hover:text-[#0C2A47]"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span className="hidden xl:inline">Why?</span>
                  </button>
                )}
              </div>

              {(!currentCase.actions || currentCase.actions.length === 0 || currentCase.actions[0].caseId !== currentCase.id) ? (
                <div className="py-4 text-sm font-mono-tech text-[#5B6B80] text-center">
                  Continue conversation to determine the appropriate action.
                </div>
              ) : (
                <>
                  {showWhyExplain && (
                    <div className="mb-2 p-2 bg-white border border-[#DCE5ED] text-[11px] text-[#5B6B80] leading-snug rounded-[2px]">
                      <strong>Administrative Rule:</strong> {currentCase.actions[0].whyItMatters}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="font-display font-bold text-sm text-[#0C2A47] flex items-start gap-1.5">
                      <ArrowRight className="w-4 h-4 text-[#D99020] mt-0.5 shrink-0" />
                      <span className="leading-tight">
                        {selectedLanguage === 'ta' && currentCase.actions[0].title.includes('NPCI')
                          ? 'வங்கிக்குச் சென்று ஆதார் இணைப்பு (Aadhaar Seeding) ஒப்புதல் படிவத்தை சமர்ப்பிக்கவும்'
                          : currentCase.actions[0].title}
                      </span>
                    </div>
                    <p className="text-xs text-[#5B6B80] pl-5">
                      {selectedLanguage === 'ta' && currentCase.actions[0].title.includes('NPCI')
                        ? 'தயாரிக்கப்பட்ட வங்கி கோரிக்கை மனுவினை அச்சிட்டு அசல் ஆதாருடன் எடுத்துச் செல்லவும்.'
                        : (currentCase.actions[0].instructions[0] || 'Follow the instructions in the generated Fix Passport.')}
                    </p>
                    <div className="pl-5 pt-1">
                      <RubberStamp variant="ACTION_REQUIRED" size="sm" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
