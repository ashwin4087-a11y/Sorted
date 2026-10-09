import React, { useState, useEffect } from 'react';
import { getCitizens, createCitizen, authorizeDigilocker, digilockerCallback, getProfile, updateProfile } from '../services/api';
import { UserCheck, ShieldCheck, Loader2, AlertCircle, Edit, Check, AlertTriangle } from 'lucide-react';

export function CitizenProfile({ onProfileSelected, onOpenChatbot }: { onProfileSelected: (citizen: any) => void, onOpenChatbot?: () => void }) {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'EDIT_PROFILE'>('LIST');
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  const [fullProfile, setFullProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '', phone: '', state: '', district: ''
  });

  const [attrForm, setAttrForm] = useState({
    age: '', gender: '', income: '', student: '', farmer: '', entrepreneur: ''
  });

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    loadCitizens();
  }, []);

  const loadCitizens = async () => {
    setLoading(true);
    try {
      const data = await getCitizens();
      setCitizens(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await createCitizen(formData);
      await loadCitizens();
      setFormData({ name: '', phone: '', state: '', district: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  const loadFullProfile = async (id: string) => {
    try {
      const p = await getProfile(id);
      setFullProfile(p);
      setAttrForm({
        age: p.attributes.age?.value || '',
        gender: p.attributes.gender?.value || '',
        income: p.attributes.income?.value || '',
        student: p.attributes.student?.value || '',
        farmer: p.attributes.farmer?.value || '',
        entrepreneur: p.attributes.entrepreneur?.value || ''
      });
      setSelectedCitizenId(id);
      setViewMode('EDIT_PROFILE');
    } catch (err: any) {
      setError(err.message || 'Failed to load full profile');
    }
  };

  const saveProfileAttrs = async () => {
    try {
      const attrs = Object.entries(attrForm).filter(([_, v]) => v).map(([k, v]) => ({
        attribute_name: k,
        attribute_value: v,
        source: 'USER_INPUT',
        status: 'SELF_DECLARED'
      }));
      await updateProfile({ citizen_id: selectedCitizenId, attributes: attrs });
      await loadFullProfile(selectedCitizenId!);
    } catch(err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleVerify = async () => {
    if (!selectedCitizenId) return;
    setVerifyingId(selectedCitizenId);
    setError('');
    try {
      const authReq = await authorizeDigilocker(selectedCitizenId);
      // Simulate OAuth redirect and callback
      const success = confirm(`Simulating DigiLocker Redirect to:\n${authReq.auth_url}\n\nClick OK to grant consent and return.`);
      if (success) {
        await digilockerCallback(authReq.state, "mock_auth_code_123");
        await loadFullProfile(selectedCitizenId);
        await loadCitizens();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#123B63]" /></div>;
  }

  if (viewMode === 'EDIT_PROFILE' && fullProfile) {
    const c = fullProfile.citizen;
    const attrs = fullProfile.attributes;
    return (
      <div className="w-full pb-12">
        <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-page-heading text-[#123B63]">Verified Profile</h2>
            <p className="text-supporting mt-2">Review your information before applying for schemes.</p>
          </div>
          <div className="flex items-center gap-4">
            {onOpenChatbot && (
              <button 
                onClick={onOpenChatbot}
                className="bg-white border-2 border-[#123B63] text-[#123B63] px-4 py-1.5 rounded-[2px] font-mono-tech font-bold uppercase text-sm hover:bg-[#F7FAFC] flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Open SORTED AI
              </button>
            )}
            <button onClick={() => setViewMode('LIST')} className="text-[#123B63] underline text-body font-bold">Back to Profiles</button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FDF2F2] border-2 border-[#C95C5C] text-[#B23A3A] rounded-[2px] font-mono-tech flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white border-2 border-[#DCE5ED] rounded-[2px] p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[#DCE5ED] pb-4">
            <div>
              <h3 className="text-section-heading">{c.name}</h3>
              <p className="text-supporting mt-1">{c.phone} • {c.state}</p>
            </div>
            <div>
              {c.is_verified ? (
                <span className="inline-flex items-center gap-1 bg-[#EBF7F0] text-[#2E7D57] px-3 py-1.5 rounded-[2px] text-sm font-bold border border-[#56A67A] uppercase font-mono-tech">
                  <ShieldCheck className="w-4 h-4" />
                  DigiLocker Verified
                </span>
              ) : (
                <button
                  onClick={handleVerify}
                  disabled={verifyingId === c.id}
                  className="bg-[#FEF7EA] text-[#D99020] border-2 border-[#F4B942] px-3 py-1.5 rounded-[2px] text-sm font-bold hover:bg-[#F4B942] hover:text-white flex items-center gap-2 font-mono-tech uppercase transition-colors"
                >
                  {verifyingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Connect DigiLocker
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-component-heading text-[#123B63] mb-4">Identity Details</h4>
              <div className="space-y-3 text-body">
                <div className="flex justify-between">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">State:</span>
                  <span className="font-bold">{c.state} {attrs.state?.status === 'VERIFIED' && <Check className="w-4 h-4 text-[#56A67A] inline"/>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">District:</span>
                  <span className="font-bold">{c.district} {attrs.district?.status === 'VERIFIED' && <Check className="w-4 h-4 text-[#56A67A] inline"/>}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">Age:</span>
                  <input type="number" className="border-2 border-[#DCE5ED] rounded-[2px] px-2 py-1 w-20 text-right focus:border-[#123B63] outline-none font-mono-tech" value={attrForm.age} onChange={e => setAttrForm({...attrForm, age: e.target.value})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">Gender:</span>
                  <select className="border-2 border-[#DCE5ED] rounded-[2px] px-2 py-1 w-28 text-right focus:border-[#123B63] outline-none font-mono-tech" value={attrForm.gender} onChange={e => setAttrForm({...attrForm, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-component-heading text-[#123B63] mb-4">Socio-Economic</h4>
              <div className="space-y-3 text-body">
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">Annual Income:</span>
                  <input type="number" className="border-2 border-[#DCE5ED] rounded-[2px] px-2 py-1 w-28 text-right focus:border-[#123B63] outline-none font-mono-tech" value={attrForm.income} onChange={e => setAttrForm({...attrForm, income: e.target.value})} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">Student:</span>
                  <select className="border-2 border-[#DCE5ED] rounded-[2px] px-2 py-1 w-28 text-right focus:border-[#123B63] outline-none font-mono-tech" value={attrForm.student} onChange={e => setAttrForm({...attrForm, student: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6B80] font-mono-tech text-xs uppercase">Farmer:</span>
                  <select className="border-2 border-[#DCE5ED] rounded-[2px] px-2 py-1 w-28 text-right focus:border-[#123B63] outline-none font-mono-tech" value={attrForm.farmer} onChange={e => setAttrForm({...attrForm, farmer: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#DCE5ED]">
            <button onClick={saveProfileAttrs} className="bg-[#F7FAFC] border-2 border-[#DCE5ED] text-[#5B6B80] px-4 py-2 rounded-[2px] font-mono-tech font-bold uppercase text-sm hover:border-[#123B63] hover:text-[#123B63] transition-colors">
              Save Attributes
            </button>
            <button onClick={() => onProfileSelected(c)} className="bg-[#123B63] text-white px-6 py-2 rounded-[2px] font-mono-tech font-bold uppercase text-sm hover:bg-[#0C2A47] ml-auto transition-colors">
              Confirm & Find Schemes
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="w-full pb-12">
      <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-page-heading text-[#123B63] mb-2">Citizen Profiles</h2>
        <p className="text-supporting">Select a profile to verify details and discover eligible government schemes.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#FDF2F2] border-2 border-[#C95C5C] text-[#B23A3A] rounded-[2px] font-mono-tech flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile List */}
        <div className="space-y-4">
          <h3 className="text-section-heading text-[#123B63] mb-4">Your Profiles</h3>
          {citizens.length === 0 ? (
            <p className="text-supporting italic">No profiles found. Create one to get started.</p>
          ) : (
            citizens.map(c => (
              <div key={c.id} className="border-2 border-[#DCE5ED] rounded-[2px] p-5 bg-white shadow-sm hover:border-[#123B63] transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-component-heading text-[#17212B]">{c.name}</h4>
                    <p className="text-supporting mt-1">{c.phone} • {c.state}</p>
                  </div>
                  {c.is_verified ? (
                    <span className="inline-flex items-center gap-1 bg-[#EBF7F0] text-[#2E7D57] px-2 py-1 rounded-[2px] text-[10px] font-bold border border-[#56A67A] uppercase font-mono-tech">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-[#FEF7EA] text-[#D99020] px-2 py-1 rounded-[2px] text-[10px] font-bold border border-[#F4B942] uppercase font-mono-tech">
                      Unverified
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => loadFullProfile(c.id)}
                    className="flex-1 bg-[#123B63] text-white py-2 rounded-[2px] font-mono-tech font-bold uppercase text-xs hover:bg-[#0C2A47] transition-colors"
                  >
                    Open Profile
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Profile Form */}
        <div className="bg-white p-6 rounded-[2px] border-2 border-[#123B63] shadow-[4px_4px_0_0_#123B63]">
          <h3 className="text-section-heading text-[#123B63] mb-4">Create New Profile</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold font-mono-tech uppercase text-[#123B63] mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border-2 border-[#DCE5ED] rounded-[2px] focus:border-[#123B63] outline-none font-mono-tech text-sm transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold font-mono-tech uppercase text-[#123B63] mb-1">Phone Number</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border-2 border-[#DCE5ED] rounded-[2px] focus:border-[#123B63] outline-none font-mono-tech text-sm transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-mono-tech uppercase text-[#123B63] mb-1">State</label>
                <input type="text" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border-2 border-[#DCE5ED] rounded-[2px] focus:border-[#123B63] outline-none font-mono-tech text-sm transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono-tech uppercase text-[#123B63] mb-1">District</label>
                <input type="text" required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2 border-2 border-[#DCE5ED] rounded-[2px] focus:border-[#123B63] outline-none font-mono-tech text-sm transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="w-full mt-4 bg-[#123B63] text-white py-3 rounded-[2px] font-mono-tech font-bold uppercase text-sm hover:bg-[#0C2A47] transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
}
