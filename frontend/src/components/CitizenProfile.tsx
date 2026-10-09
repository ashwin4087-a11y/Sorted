import React, { useState, useEffect } from 'react';
import { getCitizens, createCitizen, authorizeDigilocker, digilockerCallback, getProfile, updateProfile } from '../services/api';
import { UserCheck, ShieldCheck, Loader2, AlertCircle, Edit, Check, AlertTriangle } from 'lucide-react';

export function CitizenProfile({ onProfileSelected }: { onProfileSelected: (citizen: any) => void }) {
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-serif text-[#123B63] font-bold tracking-tight">Verified Profile</h2>
            <p className="text-gray-600">Review your information before applying for schemes.</p>
          </div>
          <button onClick={() => setViewMode('LIST')} className="text-[#123B63] underline text-sm">Back to Profiles</button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-xl font-bold">{c.name}</h3>
              <p className="text-sm text-gray-500">{c.phone} • {c.state}</p>
            </div>
            <div>
              {c.is_verified ? (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-bold border border-green-200">
                  <ShieldCheck className="w-4 h-4" />
                  DigiLocker Verified
                </span>
              ) : (
                <button
                  onClick={handleVerify}
                  disabled={verifyingId === c.id}
                  className="bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-amber-200 flex items-center gap-2"
                >
                  {verifyingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Connect DigiLocker
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-[#123B63]">Identity Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">State:</span>
                  <span className="font-bold">{c.state} {attrs.state?.status === 'VERIFIED' && <Check className="w-3 h-3 text-green-600 inline"/>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">District:</span>
                  <span className="font-bold">{c.district} {attrs.district?.status === 'VERIFIED' && <Check className="w-3 h-3 text-green-600 inline"/>}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age:</span>
                  <input type="number" className="border px-1 w-20 text-right" value={attrForm.age} onChange={e => setAttrForm({...attrForm, age: e.target.value})} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gender:</span>
                  <select className="border px-1 w-24 text-right" value={attrForm.gender} onChange={e => setAttrForm({...attrForm, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-[#123B63]">Socio-Economic</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Annual Income:</span>
                  <input type="number" className="border px-1 w-24 text-right" value={attrForm.income} onChange={e => setAttrForm({...attrForm, income: e.target.value})} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Student:</span>
                  <select className="border px-1 w-24 text-right" value={attrForm.student} onChange={e => setAttrForm({...attrForm, student: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Farmer:</span>
                  <select className="border px-1 w-24 text-right" value={attrForm.farmer} onChange={e => setAttrForm({...attrForm, farmer: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button onClick={saveProfileAttrs} className="bg-gray-100 text-gray-800 px-4 py-2 rounded font-bold hover:bg-gray-200">
              Save Attributes
            </button>
            <button onClick={() => onProfileSelected(c)} className="bg-[#123B63] text-white px-6 py-2 rounded font-bold hover:bg-[#0C2A47] ml-auto">
              Confirm & Find Schemes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-[#123B63] mb-2 font-bold tracking-tight">Citizen Profiles</h2>
        <p className="text-gray-600">Select a profile to verify details and discover eligible government schemes.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile List */}
        <div className="space-y-4">
          <h3 className="text-xl font-medium text-[#123B63] mb-4">Your Profiles</h3>
          {citizens.length === 0 ? (
            <p className="text-gray-500 italic">No profiles found. Create one to get started.</p>
          ) : (
            citizens.map(c => (
              <div key={c.id} className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{c.name}</h4>
                    <p className="text-sm text-gray-500">{c.phone} • {c.state}</p>
                  </div>
                  {c.is_verified ? (
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                      Unverified
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => loadFullProfile(c.id)}
                    className="flex-1 bg-[#123B63] text-white py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
                  >
                    Open Profile
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Profile Form */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-xl font-medium text-[#123B63] mb-4">Create New Profile</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#123B63] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#123B63] outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#123B63] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input type="text" required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#123B63] outline-none" />
              </div>
            </div>
            <button type="submit" disabled={creating} className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
