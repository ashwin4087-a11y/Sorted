import React, { useState } from 'react';
import { CitizenCase } from './types';
import { SortedLogo } from './components/SortedLogo';
import { RubberStamp } from './components/RubberStamp';
import { MechanicalOdometer } from './components/MechanicalOdometer';
import { OperatorConsole } from './components/OperatorConsole';
import { PreSubmissionHealthCheck } from './components/PreSubmissionHealthCheck';
import { DBTFailureDiagnoser } from './components/DBTFailureDiagnoser';
import { GeneratedArtifactsView } from './components/GeneratedArtifactsView';
import { OneTripPlannerView } from './components/OneTripPlannerView';
import { AuthScreen } from './components/AuthScreen';
import { CitizenProfile } from './components/CitizenProfile';
import { CaseHeader } from './components/CaseHeader';
import { SchemeDiscovery } from './components/SchemeDiscovery';
import { CaseTimelineTracker } from './components/CaseTimelineTracker';
import { startPaymentDiagnosis, createApplication, getAuthToken, setAuthToken, clearAuthToken, getCurrentOperator, Operator, AuthResponse } from './services/api';
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
  Sparkles,
  LogOut,
  Loader2
} from 'lucide-react';

type ActiveTab = 
  | 'HOME'
  | 'CONSOLE' 
  | 'HEALTH_CHECK' 
  | 'DBT_DIAGNOSER' 
  | 'LETTERS' 
  | 'ONE_TRIP' 
  | 'TIMELINE'
  | 'PROFILE'
  | 'DISCOVER';

const EMPTY_CASE: CitizenCase = {
  id: '',
  caseRef: '',
  createdDate: new Date().toISOString().split('T')[0],
  schemeName: '',
  citizenName: '',
  citizenAge: 0,
  language: 'en',
  location: '',
  status: 'NEW',
  journey: 'PRE_SUBMISSION_HEALTH_CHECK',
  readinessPercentage: 0,
  extractedFacts: [],
  documents: [],
  events: [],
  actions: [],
  ruleTraces: []
};

export default function App() {
  const [selectedCitizen, setSelectedCitizen] = useState<any>(() => {
    const saved = localStorage.getItem('sorted_citizen');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentCase, setCurrentCase] = useState<CitizenCase>(() => {
    const saved = localStorage.getItem('sorted_case');
    return saved ? JSON.parse(saved) : EMPTY_CASE;
  });
  const [operator, setOperator] = useState<Operator | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(() => !!getAuthToken());

  // Restore an existing session only if the backend still accepts the token.
  React.useEffect(() => {
    if (!getAuthToken()) return;
    getCurrentOperator()
      .then(setOperator)
      .catch(() => clearAuthToken())
      .finally(() => setAuthChecking(false));
  }, []);

  const handleLogin = (auth: AuthResponse) => {
    setAuthToken(auth.token);
    setOperator(auth.operator);
    setActiveTab('PROFILE');
  };

  const handleLogout = () => {
    localStorage.removeItem('sorted_case');
    localStorage.removeItem('sorted_citizen');
    window.google?.accounts?.id?.disableAutoSelect?.();
    setOperator(null);
    setSelectedCitizen(null);
    setCurrentCase(EMPTY_CASE);
    setActiveTab('HOME');
  };
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem('sorted_case');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.journey === 'PRE_SUBMISSION_HEALTH_CHECK' ? 'HEALTH_CHECK' : 'CONSOLE';
    }
    return 'DISCOVER';
  });

  React.useEffect(() => {
    if (activeTab !== 'HOME') {
      localStorage.setItem('sorted_case', JSON.stringify(currentCase));
      if (selectedCitizen) {
        localStorage.setItem('sorted_citizen', JSON.stringify(selectedCitizen));
      }
    }
  }, [currentCase, activeTab, selectedCitizen]);

  const resetDemo = () => {
    localStorage.removeItem('sorted_case');
    setCurrentCase(EMPTY_CASE);
    setActiveTab('DISCOVER');
  };

  const handleStartCheck = async (scheme: any) => {
    if (!selectedCitizen) {
      alert("Please select a Citizen Profile first.");
      setActiveTab('PROFILE');
      return;
    }
    // Transition to pre-submission check with the selected scheme
    try {
      const appData = await createApplication({
        citizen_id: selectedCitizen.id,
        scheme_id: scheme.id,
        status: "DRAFT"
      });
      const newCase: CitizenCase = {
        ...EMPTY_CASE,
        id: appData.id,
        citizenId: selectedCitizen.id,
        citizenName: selectedCitizen.name,
        schemeName: scheme.name,
        journey: 'PRE_SUBMISSION_HEALTH_CHECK',
      };
      setCurrentCase(newCase);
      setActiveTab('HEALTH_CHECK');
    } catch (e: any) {
      console.error(e);
      alert(`Application failed: ${e.message || e}`);
    }
  };

  const handleTriggerDiagnosis = async (errorText: string) => {
    try {
      const citizenId = selectedCitizen?.id || "00000000-0000-0000-0000-000000000000"; 
      const response = await startPaymentDiagnosis({ citizen_id: citizenId, reported_problem: errorText });
      
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

  if (authChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F7FAFC] font-mono-tech text-sm text-[#5B6B80] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Verifying session…
      </div>
    );
  }

  if (!operator) {
    return <AuthScreen onLogin={handleLogin} />;
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
              onClick={() => setActiveTab('PROFILE')}
              className={`px-2 py-1 font-bold uppercase transition-colors rounded-[2px] ${
                activeTab === 'PROFILE'
                  ? 'bg-[#123B63] text-white shadow-sm'
                  : 'text-[#5B6B80] hover:text-[#0C2A47]'
              }`}
            >
              Profile
            </button>
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
          <div className="flex items-center gap-2 shrink-0">
            <div id="operator-profile" className="flex items-center gap-2 border border-[#DCE5ED] bg-[#F7FAFC] pl-1 pr-2.5 py-0.5 rounded-[2px]" title={operator.email}>
              {operator.picture_url ? (
                <img src={operator.picture_url} alt="" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#123B63] text-white text-[11px] font-bold flex items-center justify-center">
                  {operator.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="hidden lg:block text-xs font-mono-tech font-bold text-[#0C2A47] max-w-[160px] truncate">
                {operator.name}
              </span>
            </div>

            <button
              id="reset-case"
              onClick={resetDemo}
              title="Clear the current case and start fresh"
              className="px-3 py-1 text-xs font-mono-tech font-bold border border-[#123B63] text-[#123B63] rounded-[1px] hover:bg-[#F7FAFC] transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              NEW CASE
            </button>

            <button
              id="logout-button"
              onClick={handleLogout}
              className="px-3 py-1 text-xs font-mono-tech font-bold bg-[#B23A3A] text-white rounded-[1px] hover:bg-[#8f2b2b] transition-all whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              LOGOUT
            </button>
          </div>
        </div>

        {/* Signature Header Stripe */}
        <div className="signature-stripe" />
      </header>

      {/* Mobile Nav Bar */}
      <div className="md:hidden bg-white border-b border-[#DCE5ED] px-2 py-2 flex flex-wrap items-center gap-1 text-[11px] font-mono-tech font-bold">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-2 py-1 rounded-[2px] whitespace-nowrap ${activeTab === 'PROFILE' ? 'bg-[#123B63] text-white' : 'text-[#5B6B80]'}`}
        >
          Profile
        </button>
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
        {activeTab === 'PROFILE' && (
          <div className="h-full overflow-y-auto">
            <CitizenProfile 
              onProfileSelected={(citizen) => {
                setSelectedCitizen(citizen);
                setActiveTab('DISCOVER');
              }} 
            />
          </div>
        )}
        
        {activeTab === 'DISCOVER' && (
          <div className="h-full min-h-0 overflow-y-auto">
            <SchemeDiscovery onStartCheck={handleStartCheck} />
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
