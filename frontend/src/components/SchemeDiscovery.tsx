import React, { useState, useEffect } from 'react';
import { getSchemes } from '../services/api';
import { Search, Loader2, BookOpen } from 'lucide-react';

interface SchemeDiscoveryProps {
  onStartCheck?: (scheme: any) => void;
}

export const SchemeDiscovery: React.FC<SchemeDiscoveryProps> = ({ onStartCheck }) => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setIsLoading(true);
        const data = await getSchemes({ keyword: search });
        setSchemes(data.items || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load schemes');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search slightly
    const timer = setTimeout(loadSchemes, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="h-full bg-[#F7FAFC] p-6 max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-[#123B63] p-5 rounded-[2px] shadow-sm">
        <h2 className="font-display font-[800] text-2xl text-[#0C2A47] tracking-tight uppercase">
          Scheme Discovery Engine
        </h2>
        <p className="text-sm text-[#5B6B80] mt-1">
          Search the definitive master registry of welfare schemes and find your exact entitlement.
        </p>

        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6B80]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme name, category, or keyword..."
            className="w-full border-2 border-[#123B63] rounded-[2px] py-2 pl-10 pr-4 font-mono-tech text-sm focus:outline-none focus:bg-[#F7FAFC]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#FDF2F2] border border-[#F2CDCD] p-4 text-[#B23A3A] text-sm font-bold rounded-[2px]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#123B63]" />
        </div>
      ) : schemes.length === 0 ? (
        <div className="text-center p-12 bg-white border border-[#DCE5ED] rounded-[2px]">
          <p className="text-[#5B6B80] font-mono-tech">No schemes found matching your search.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white border border-[#DCE5ED] hover:border-[#123B63] p-4 rounded-[2px] shadow-sm flex flex-col transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-bold text-lg text-[#0C2A47] leading-tight">
                  {scheme.name}
                </h3>
                {scheme.scheme_code && (
                  <span className="bg-[#E2E8F0] text-[#17212B] text-[10px] font-mono-tech px-2 py-0.5 rounded-[1px] whitespace-nowrap ml-2">
                    {scheme.scheme_code}
                  </span>
                )}
              </div>
              
              <div className="text-xs text-[#5B6B80] mb-3 flex-1">
                {scheme.description || 'Official scheme details available upon consultation.'}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {scheme.category && (
                  <span className="border border-[#123B63] text-[#123B63] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[1px]">
                    {scheme.category}
                  </span>
                )}
                {scheme.level && (
                  <span className="bg-[#123B63] text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[1px]">
                    {scheme.level}
                  </span>
                )}
              </div>

              <button 
                onClick={() => onStartCheck && onStartCheck(scheme)}
                className="w-full bg-[#123B63] text-white py-2 text-xs font-mono-tech font-bold uppercase rounded-[1px] hover:bg-[#0C2A47] flex items-center justify-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" /> Start Pre-Submission Check
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
