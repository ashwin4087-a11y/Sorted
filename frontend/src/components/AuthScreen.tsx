import React, { useEffect, useRef, useState } from 'react';
import { SortedLogo } from './SortedLogo';
import { Lock, Mail, User, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import {
  AuthResponse,
  getAuthConfig,
  googleSignIn,
  passwordLogin,
  passwordSignup,
} from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthScreenProps {
  onLogin: (auth: AuthResponse) => void;
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';

/** Load the Google Identity Services script once. */
function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Could not load Google Sign-In. Check your internet connection.')));
    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const onLoginRef = useRef(onLogin);
  onLoginRef.current = onLogin;

  // Initialise real Google Sign-In: the button opens Google's account chooser,
  // Google returns a signed ID token, and the backend verifies it before a session is issued.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { google_client_id } = await getAuthConfig();
        if (!google_client_id) {
          if (!cancelled) setGoogleStatus('unconfigured');
          return;
        }
        await loadGoogleScript();
        if (cancelled || !googleButtonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: google_client_id,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (resp: { credential?: string }) => {
            if (!resp.credential) {
              setError('Google sign-in was cancelled.');
              return;
            }
            setSubmitting(true);
            setError(null);
            try {
              onLoginRef.current(await googleSignIn(resp.credential));
            } catch (err: any) {
              setError(err?.message || 'Google authentication failed.');
            } finally {
              setSubmitting(false);
            }
          },
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: googleButtonRef.current.offsetWidth || 336,
        });
        setGoogleStatus('ready');
      } catch (err: any) {
        if (!cancelled) {
          setGoogleStatus('error');
          setError(err?.message || 'Could not initialise Google Sign-In.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const auth = isLogin
        ? await passwordLogin(email.trim(), password)
        : await passwordSignup(name.trim(), email.trim(), password);
      onLogin(auth);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-6 text-[#17212B]">
      <div className="max-w-md w-full">
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center mb-6">
            <SortedLogo size="lg" />
          </div>
          <h1 className="font-display font-[800] text-2xl md:text-3xl text-[#0C2A47] tracking-tight uppercase">
            {isLogin ? 'Login' : 'Create Account'}
          </h1>
          <p className="font-mono-tech text-sm text-[#5B6B80]">
            Secure access to the Last-Mile Government Benefits Agent.
          </p>
        </div>

        <div className="bg-white border-2 border-[#123B63] p-8 shadow-[8px_8px_0_0_#123B63] rounded-[2px] transition-all">
          {error && (
            <div
              id="auth-error"
              role="alert"
              className="mb-5 flex items-start gap-2 border-2 border-[#B23A3A] bg-[#FDF2F2] text-[#8f2b2b] text-sm font-mono-tech p-3 rounded-[2px]"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="font-mono-tech text-xs font-bold text-[#123B63] uppercase tracking-wide flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  minLength={2}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-[#DCE5ED] focus:border-[#123B63] rounded-[2px] py-2 px-3 text-sm focus:outline-none transition-colors"
                  placeholder="Your full name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="font-mono-tech text-xs font-bold text-[#123B63] uppercase tracking-wide flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-[#DCE5ED] focus:border-[#123B63] rounded-[2px] py-2 px-3 text-sm focus:outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="font-mono-tech text-xs font-bold text-[#123B63] uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={isLogin ? 1 : 8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-[#DCE5ED] focus:border-[#123B63] rounded-[2px] py-2 px-3 text-sm focus:outline-none transition-colors"
                placeholder={isLogin ? '••••••••' : 'At least 8 characters'}
              />
            </div>

            <button
              id="auth-submit"
              type="submit"
              disabled={submitting}
              className="w-full bg-[#123B63] hover:bg-[#0C2A47] disabled:opacity-60 disabled:cursor-wait text-white font-mono-tech font-bold uppercase text-sm py-3 px-4 rounded-[2px] shadow-sm transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {submitting ? 'Verifying…' : isLogin ? 'Login' : 'Register Account'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#DCE5ED] pt-6 space-y-4">
            <div className="flex items-center gap-3 text-[11px] font-mono-tech text-[#5B6B80] uppercase">
              <span className="flex-1 h-px bg-[#DCE5ED]" /> or <span className="flex-1 h-px bg-[#DCE5ED]" />
            </div>

            {/* Google renders its official button here; clicking it opens the account chooser */}
            <div id="google-signin-button" ref={googleButtonRef} className="w-full flex justify-center min-h-[44px]" />

            {googleStatus === 'loading' && (
              <p className="text-center text-xs font-mono-tech text-[#5B6B80] flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading Google Sign-In…
              </p>
            )}
            {googleStatus === 'unconfigured' && (
              <p className="text-center text-xs font-mono-tech text-[#8f2b2b]">
                Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in backend/.env.
              </p>
            )}

            {/* Developer bypass for Google Sign-In in local dev */}
            {window.location.hostname === 'localhost' && (
              <button
                type="button"
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    onLoginRef.current(await googleSignIn('mock_google_token'));
                  } catch (err: any) {
                    setError(err?.message || 'Mock Google authentication failed.');
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="w-full mt-2 bg-white border border-[#DCE5ED] text-[#5B6B80] hover:bg-[#F7FAFC] font-mono-tech font-bold uppercase text-xs py-2 px-4 rounded-[2px] shadow-sm transition-colors"
              >
                Mock Google Login (Local Dev Only)
              </button>
            )}

            <div className="text-center">
              <button
                id="auth-toggle-mode"
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sm font-mono-tech font-bold text-[#5B6B80] hover:text-[#123B63] transition-colors"
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-[#5B6B80] font-mono-tech space-y-1">
          <p>PROTECTED BY SORTED SECURE VAULT PROTOCOL</p>
          <p>ALL ACTIONS ARE AUDITED</p>
        </div>
      </div>
    </div>
  );
};
