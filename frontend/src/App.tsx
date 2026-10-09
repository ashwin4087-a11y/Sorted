import React, { useState } from 'react';
import { CitizenCase } from './types';
import { LAKSHMI_CASE, LAKSHMI_PRE_CASE } from './data/demoCases';
import { SortedLogo } from './components/SortedLogo';
import { RubberStamp } from './components/RubberStamp';
import { MechanicalOdometer } from './components/MechanicalOdometer';
import { OperatorConsole } from './components/OperatorConsole';
import { PreSubmissionHealthCheck } from './components/PreSubmissionHealthCheck';
import { DBTFailureDiagnoser } from './components/DBTFailureDiagnoser';
import { GeneratedArtifactsView } from './components/GeneratedArtifactsView';
import { OneTripPlannerView } from './components/OneTripPlannerView';
import { EntryScreen } from './components/EntryScreen';
import { CaseHeader } from './components/CaseHeader';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { startPaymentDiagnosis } from './services/api';
import { runHealthCheck } from './engine/healthCheckEngine';
import { 
  Activity, 
  FileCheck2, 
  Stethoscope, 
  FileText, 
  MapPin, 
  GitBranch, 
  UserCheck, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

type ActiveTab = 
  | 'HOME'
  | 'CONSOLE' 
  | 'HEALTH_CHECK' 
  | 'DBT_DIAGNOSER' 
  | 'LETTERS' 
  | 'ONE_TRIP' 
  | 'TIMELINE'
  | 'DISCOVER';

export default function App() {
  const [currentCase, setCurrentCase] = useState<CitizenCase>(() => {
    const saved = localStorage.getItem('sorted_case');
    return saved ? JSON.parse(saved) : LAKSHMI_CASE;
  });
  const [activeCaseId, setActiveCaseId] = useState<'LAKSHMI' | 'LAKSHMI_PRE'>(() => {
    const saved = localStorage.getItem('sorted_case');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.journey === 'PRE_SUBMISSION_HEALTH_CHECK' ? 'LAKSHMI_PRE' : 'LAKSHMI';
    }
    return 'LAKSHMI';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('sorted_case');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.journey === 'PRE_SUBMISSION_HEALTH_CHECK' ? 'HEALTH_CHECK' : 'CONSOLE';
    }
    return 'HOME';
  });

  React.useEffect(() => {
    if (activeTab !== 'HOME') {
      localStorage.setItem('sorted_case', JSON.stringify(currentCase));
    }
  }, [currentCase, activeTab]);

  const resetDemo = () => {
    localStorage.removeItem('sorted_case');
    setCurrentCase(LAKSHMI_CASE);
    setActiveTab('HOME');
  };

  const handleSelectJourney = (journey: 'PRE' | 'POST' | 'DISCOVER') => {
    if (journey === 'DISCOVER') {
      setActiveTab('DISCOVER');
    } else if (journey === 'PRE') {
      setActiveCaseId('LAKSHMI_PRE');
      setCurrentCase(LAKSHMI_PRE_CASE);
      setActiveTab('HEALTH_CHECK');
    } else {
      setActiveCaseId('LAKSHMI');
      setCurrentCase(LAKSHMI_CASE);
      setActiveTab('CONSOLE');
    }
  };

  const switchCase = (caseId: 'LAKSHMI' | 'LAKSHMI_PRE') => {
    setActiveCaseId(caseId);
    if (caseId === 'LAKSHMI') {
      setCurrentCase(LAKSHMI_CASE);
      setActiveTab('CONSOLE');
    } else {
      setCurrentCase(LAKSHMI_PRE_CASE);
      setActiveTab('HEALTH_CHECK');
    }
  };

  const handleTriggerDiagnosis = async (errorText: string) => {
    try {
      const dummyCitizenId = "00000000-0000-0000-0000-000000000000"; 
      const response = await startPaymentDiagnosis({ citizen_id: dummyCitizenId, reported_problem: errorText });
      
      let diag: any = { isUnknownReason: false, confidence: 'HIGH', destination: 'BANK', title: 'DBT Payment Failed' };
      if (response.diagnosis) {
         diag = {
            code: response.failure_code,
            title: response.diagnosis,
            remedy: response.remedy,
            stage: 'Payment',
            confidence: response.confidence,
            destination: 'BANK', // Simplified for demo
            nextAction: response.next_action,
            requiredDocuments: response.required_documents,
            evidenceSource: 'Backend API',
            taxonomySource: response.source_reference,
            evidence: response.reason
         };
      }

      // Remove previous diagnosis events
      const filteredEvents = currentCase.events.filter(e => e.eventType !== 'DIAGNOSIS_PERFORMED' && e.eventType !== 'LETTER_GENERATED' && e.eventType !== 'CITIZEN_ACTION_MARKED');

      const updatedCase: CitizenCase = {
        ...currentCase,
        diagnosis: diag,
        status: 'ACTION_READY',
        readinessPercentage: 42,
        actions: [], // Actions come from the backend's action compiler but we'll mock or leave empty for this quick patch, or call a backend compile_actions endpoint if it exists.
        events: [
          ...filteredEvents,
          {
            id: `EV-DIAG-${Date.now()}`,
            caseId: currentCase.id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            eventType: 'DIAGNOSIS_PERFORMED',
            title: `Diagnostic Evaluation: ${diag.code || 'STARTED'}`,
            description: response.diagnosis ? `Identified: ${diag.title}` : `Diagnosis started. Question: ${response.question}`,
            actor: 'PFMS_ENGINE'
          }
        ]
      };

      setCurrentCase(updatedCase);
      setActiveTab('DBT_DIAGNOSER');
    } catch (error) {
      console.error("Diagnosis error", error);
    }
  };

  if (activeTab === 'HOME') {
    return <EntryScreen onSelectJourney={handleSelectJourney} />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-[#F7FAFC] text-[#17212B] overflow-hidden">
      
      {/* 1. TOP BAR CONTRACT: Exhaustive 3-zone architecture */}
      <header className="bg-white border-b border-[#DCE5ED] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 md:gap-4">
          
          {/* Zone 1: Single element Brand Zone */}
          <div className="shrink-0 flex items-center">
            <SortedLogo size="md" />
          </div>

          {/* Zone 2: Clean 4–6 text navigation links */}
          <nav className="hidden md:flex flex-wrap items-center gap-1 text-[11px] font-mono-tech py-1">
            <button
              onClick={() => setActiveTab('DISCOVER')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'DISCOVER'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('CONSOLE')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'CONSOLE'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Operator Console
            </button>
            <button
              onClick={() => setActiveTab('HEALTH_CHECK')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'HEALTH_CHECK'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Pre-Submission Check
            </button>
            <button
              onClick={() => setActiveTab('DBT_DIAGNOSER')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'DBT_DIAGNOSER'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              DBT Failure Diagnoser
            </button>
            <button
              onClick={() => setActiveTab('LETTERS')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'LETTERS'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Generated Letters
            </button>
            <button
              onClick={() => setActiveTab('ONE_TRIP')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'ONE_TRIP'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              One-Trip Planner
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'TIMELINE'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Case Timeline
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5 bg-[#F7FAFC] border border-[#123B63] p-0.5 rounded-[2px]">
              <button
                onClick={() => switchCase('LAKSHMI')}
                className={`px-2.5 py-1 text-xs font-mono-tech font-bold transition-all rounded-[1px] whitespace-nowrap ${
                  activeCaseId === 'LAKSHMI'
                    ? 'bg-[#123B63] text-white shadow-sm'
                    : 'text-[#5B6B80] hover:text-[#0C2A47]'
                }`}
              >
                Lakshmi (DBT Blocker)
              </button>
              <button
                onClick={() => switchCase('LAKSHMI_PRE')}
                className={`px-2.5 py-1 text-xs font-mono-tech font-bold transition-all rounded-[1px] whitespace-nowrap ${
                  activeCaseId === 'LAKSHMI_PRE'
                    ? 'bg-[#123B63] text-white shadow-sm'
                    : 'text-[#5B6B80] hover:text-[#0C2A47]'
                }`}
              >
                Lakshmi (Pre-Submission)
              </button>
            </div>
            
            <button
              onClick={resetDemo}
              className="ml-2 px-3 py-1 text-xs font-mono-tech font-bold bg-[#B23A3A] text-white rounded-[1px] hover:bg-[#8f2b2b] transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              RESET DEMO
            </button>
          </div>
        </div>

        {/* Signature Header Stripe */}
        <div className="signature-stripe" />
      </header>

      {/* Mobile Nav Bar */}
      <div className="md:hidden bg-white border-b border-[#DCE5ED] px-2 py-2 flex flex-wrap items-center gap-1 text-[11px] font-mono-tech font-bold">
        <button
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'DISCOVER' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('CONSOLE')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'CONSOLE' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Console
        </button>
        <button
          onClick={() => setActiveTab('HEALTH_CHECK')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'HEALTH_CHECK' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Health Check
        </button>
        <button
          onClick={() => setActiveTab('DBT_DIAGNOSER')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'DBT_DIAGNOSER' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Diagnoser
        </button>
        <button
          onClick={() => setActiveTab('LETTERS')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'LETTERS' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Letters
        </button>
        <button
          onClick={() => setActiveTab('ONE_TRIP')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'ONE_TRIP' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          One-Trip
        </button>
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'TIMELINE' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Timeline
        </button>
      </div>

      {/* 2. UNIFIED CASE HEADER */}
      <CaseHeader 
        currentCase={currentCase} 
        onGoToFix={() => setActiveTab('ONE_TRIP')} 
      />

      {/* 3. MAIN APPLICATION WORKSPACE */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4 w-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'DISCOVER' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <SchemeDiscovery />
          </div>
        )}

        {activeTab === 'CONSOLE' && (
          <div className="h-full min-h-0 flex flex-col">
            <OperatorConsole
              currentCase={currentCase}
              onUpdateCase={setCurrentCase}
              onTriggerDiagnosis={handleTriggerDiagnosis}
            />
          </div>
        )}

        {activeTab === 'HEALTH_CHECK' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <PreSubmissionHealthCheck
              currentCase={currentCase}
              onUpdateCase={setCurrentCase}
            />
          </div>
        )}

        {activeTab === 'DBT_DIAGNOSER' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <DBTFailureDiagnoser
              currentCase={currentCase}
              onUpdateCase={setCurrentCase}
              onTriggerDiagnosis={handleTriggerDiagnosis}
              onSelectLetterTab={() => setActiveTab('LETTERS')}
            />
          </div>
        )}

        {activeTab === 'LETTERS' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <GeneratedArtifactsView
              currentCase={currentCase}
            />
          </div>
        )}

        {activeTab === 'ONE_TRIP' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <OneTripPlannerView
              currentCase={currentCase}
            />
          </div>
        )}

        {activeTab === 'TIMELINE' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <CaseTimelineTracker
              currentCase={currentCase}
              onUpdateCase={setCurrentCase}
            />
          </div>
        )}
      </main>

      {/* 4. FOOTER: Technical administrative provenance note */}
      <footer className="bg-white border-t border-[#DCE5ED] mt-auto py-2 px-4 sm:px-6 text-xs text-[#5B6B80] font-mono-tech shrink-0">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SortedLogo size="sm" />
            <span>— Government Benefit Resolution Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>PFMS Failure Table v1.0</span>
            <span aria-hidden="true">·</span>
            <span>UIDAI Verhoeff Polynomial Engine</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Rule Execution</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
