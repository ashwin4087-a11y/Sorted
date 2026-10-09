import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { authorizeDigilocker, digilockerCallback } from '../services/api';
import { Operator } from '../services/api';
import { SortedLogo } from './SortedLogo';

export function DigiLockerGateway({ operator, onVerified, onLogout }: { operator: Operator, onVerified: () => void, onLogout: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Create auth request (backend will auto-create Citizen profile if needed)
      const authReq = await authorizeDigilocker();
      
      // Step 2: Simulate the DigiLocker OAuth flow
      const success = confirm(`Simulating DigiLocker Redirect to:\n${authReq.auth_url}\n\nClick OK to grant consent and return.`);
      
      if (success) {
        // Step 3: Handle callback (backend performs document sync and marks operator as verified)
        await digilockerCallback(authReq.state, "mock_auth_code_123");
        onVerified();
      } else {
        setError('DigiLocker verification cancelled.');
      }
    } catch (err: any) {
      setError(err.message || 'DigiLocker verification could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center mb-6">
          <SortedLogo size="lg" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#123B63]">
          Verify your identity
        </h2>
        <p className="mt-4 text-[#5B6B80] leading-relaxed">
          Connect DigiLocker to securely verify your government-issued documents. 
          Your documents will only be accessed with your consent.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-[#E2E8F0]">
          
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm ring-1 ring-blue-100">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-[#123B63] hover:bg-[#0C2A47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#123B63] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting securely...
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  Verify with DigiLocker
                </>
              )}
            </button>
            
            <button
              onClick={onLogout}
              disabled={loading}
              className="w-full py-3 px-4 border border-[#DCE5ED] rounded-lg text-sm font-bold text-[#5B6B80] hover:bg-gray-50 focus:outline-none transition-colors"
            >
              Cancel and Logout
            </button>
          </div>
          
          <div className="mt-6 text-center text-xs text-[#8B9CAF]">
            <p>Verification is mandatory to access SORTED services.</p>
            <p className="mt-1">Secured by official API Setu integration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
