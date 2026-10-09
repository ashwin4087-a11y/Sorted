import React, { useState, useEffect } from 'react';
import { getSchemes, getEligibleSchemes, getNeedsVerificationSchemes } from '../services/api';
import { Search, Loader2, BookOpen, CheckCircle, AlertTriangle, XCircle, FileText } from 'lucide-react';

interface SchemeDiscoveryProps {
  onStartCheck?: (scheme: any) => void;
}

type TabType = 'ELIGIBLE' | 'ALL' | 'NEEDS_VERIFICATION';

export const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({ onStartCheck }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ELIGIBLE');
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const citizenId = JSON.parse(localStorage.getItem('sorted_citizen') || '{}').id;

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setIsLoading(true);
        if (activeTab === 'ALL') {
          const data = await getSchemes({ keyword: search });
          // Format them similarly for uniform rendering
          setSchemes((data.items || []).map((s: any) => ({
            scheme: s,
            eligibility: null
          })));
        } else if (activeTab === 'ELIGIBLE') {
          if (!citizenId) throw new Error("No citizen profile selected");
          const data = await getEligibleSchemes(citizenId);
          setSchemes(data || []);
        } else if (activeTab === 'NEEDS_VERIFICATION') {
          if (!citizenId) throw new Error("No citizen profile selected");
          const data = await getNeedsVerificationSchemes(citizenId);
          setSchemes(data || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load schemes');
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(loadSchemes, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab, citizenId]);

  const handleApply = (scheme: any, eligibilityStatus: string | null) => {
    if (eligibilityStatus === 'NOT_ELIGIBLE') {
      alert("You cannot apply to this scheme because the current verified profile does not satisfy the required eligibility conditions.");
      return;
    }
    if (eligibilityStatus === 'NEEDS_VERIFICATION') {
      alert("Additional verification is required before applying.");
      return;
    }
    if (onStartCheck) {
      onStartCheck(scheme);
    }
  };

  return (
    <div className="h-full bg-[#F7FAFC] p-6 max-w-5xl mx-auto space-y-6 flex flex-col">
      <div className="bg-white border border-[#123B63] p-5 rounded-[2px] shadow-sm shrink-0">
        <h2 className="text-page-heading text-[#0C2A47] uppercase">
          Scheme Discovery Engine
        </h2>
        <p className="text-supporting mt-2">
          Based on your verified profile, here are the welfare schemes matched for you.
        </p>

        <div className="flex gap-2 mt-4 border-b border-[#DCE5ED]">
          <button 
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'ELIGIBLE' ? 'border-b-2 border-[#123B63] text-[#123B63]' : 'text-[#5B6B80]'}`}
            onClick={() => setActiveTab('ELIGIBLE')}
          >
            Eligible for You
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'ALL' ? 'border-b-2 border-[#123B63] text-[#123B63]' : 'text-[#5B6B80]'}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Schemes
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${activeTab === 'NEEDS_VERIFICATION' ? 'border-b-2 border-[#123B63] text-[#123B63]' : 'text-[#5B6B80]'}`}
            onClick={() => setActiveTab('NEEDS_VERIFICATION')}
          >
            Needs Verification
          </button>
        </div>

        {activeTab === 'ALL' && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B80]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all schemes by name, category, or keyword..."
              className="w-full border-2 border-[#123B63] rounded-[2px] py-2 pl-10 pr-4 font-mono-tech text-sm focus:outline-none focus:bg-[#F7FAFC]"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[#FDF2F2] border border-[#F2CDCD] p-4 text-[#B23A3A] text-sm font-bold rounded-[2px]">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#123B63]" />
          </div>
        ) : schemes.length === 0 ? (
          <div className="text-center p-12 bg-white border border-[#DCE5ED] rounded-[2px]">
            <p className="text-[#5B6B80] font-mono-tech">
              {activeTab === 'ELIGIBLE' && "We couldn't find a scheme you currently qualify for. Review your profile or view all schemes."}
              {activeTab === 'ALL' && "No schemes found matching your search."}
              {activeTab === 'NEEDS_VERIFICATION' && "No schemes currently pending your verification."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 pb-12">
            {schemes.map((item, idx) => {
              const scheme = item.scheme;
              const elig = item.eligibility;
              
              return (
                <div key={scheme.id || idx} className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-4 rounded-[2px] shadow-sm flex flex-col transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-component-heading text-[#0C2A47]">
                      {scheme.name}
                    </h3>
                  </div>
                  
                  {elig && (
                    <div className="mb-3 p-2 bg-[#F7FAFC] border border-[#DCE5ED] text-technical">
                      <div className="font-bold mb-1 flex items-center gap-1">
                        {elig.status === 'ELIGIBLE' || elig.status === 'LIKELY_ELIGIBLE' ? (
                          <><CheckCircle className="w-3 h-3 text-green-600"/> {elig.match_score}</>
                        ) : elig.status === 'NEEDS_VERIFICATION' ? (
                          <><AlertTriangle className="w-3 h-3 text-amber-600"/> {elig.match_score}</>
                        ) : (
                          <><XCircle className="w-3 h-3 text-red-600"/> {elig.match_score}</>
                        )}
                      </div>
                      <ul className="text-[#5B6B80] list-disc list-inside">
                        {elig.reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                      {elig.missing_information && elig.missing_information.length > 0 && (
                        <div className="mt-1 text-amber-700">
                          ⚠ Missing: {elig.missing_information.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-supporting mb-3 flex-1 line-clamp-3">
                    {scheme.description || 'Official scheme details available upon consultation.'}
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    {activeTab === 'ALL' ? (
                      <button 
                        onClick={() => handleApply(scheme, null)}
                        className="flex-1 bg-white border border-[#123B63] text-[#123B63] py-2 text-xs font-mono-tech font-bold uppercase rounded-[1px] hover:bg-[#F7FAFC] flex items-center justify-center gap-2"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Details
                      </button>
                    ) : activeTab === 'NEEDS_VERIFICATION' ? (
                      <button 
                        onClick={() => alert("Please go to your Profile to verify missing information.")}
                        className="flex-1 bg-amber-100 border border-amber-600 text-amber-800 py-2 text-xs font-mono-tech font-bold uppercase rounded-[1px] hover:bg-amber-200 flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Complete Verification
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(scheme, elig?.status)}
                        className="flex-1 bg-[#123B63] text-white py-2 text-xs font-mono-tech font-bold uppercase rounded-[1px] hover:bg-[#0C2A47] flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Apply Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
