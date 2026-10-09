export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const AUTH_TOKEN_KEY = 'sorted_auth_token';
export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(AUTH_TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      let message = `HTTP Error: ${response.status}`;
      try {
        const body = await response.json();
        if (typeof body?.detail === 'string') message = body.detail;
        else if (Array.isArray(body?.detail)) message = body.detail.map((d: any) => d.msg).join(', ');
      } catch { /* non-JSON error body */ }
      throw new ApiError(message, response.status);
    }
    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Cannot reach the SORTED server. Please check that the backend is running.');
  }
}

// --- Schemes API ---
export async function getSchemes(params?: Record<string, any>) {
  let query = '';
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val) searchParams.append(key, String(val));
    }
    query = `?${searchParams.toString()}`;
  }
  return request<any>(`/api/schemes${query}`);
}

export async function getScheme(schemeId: string) {
  return request<any>(`/api/schemes/${schemeId}`);
}

export async function getEligibleSchemes(citizenId: string) {
  return request<any[]>(`/api/schemes/user/eligible?citizen_id=${citizenId}`);
}

export async function getNeedsVerificationSchemes(citizenId: string) {
  return request<any[]>(`/api/schemes/user/needs-verification?citizen_id=${citizenId}`);
}

export async function getSchemeEligibility(schemeId: string, citizenId: string) {
  return request<any>(`/api/schemes/${schemeId}/eligibility?citizen_id=${citizenId}`);
}

// --- Citizens API ---
export async function getCitizens() {
  return request<any[]>(`/api/citizens`);
}

export async function createCitizen(data: any) {
  return request<any>(`/api/citizens`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyDigilocker(citizenId: string, digilockerId: string) {
  return request<any>(`/api/citizens/${citizenId}/verify/digilocker`, {
    method: 'POST',
    body: JSON.stringify({ digilocker_id: digilockerId }),
  });
}

// --- Profile API ---
export async function getProfile(citizenId: string) {
  return request<any>(`/api/profile?citizen_id=${citizenId}`);
}

export async function updateProfile(data: any) {
  return request<any>(`/api/profile`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function getProfileVerification(citizenId: string) {
  return request<any>(`/api/profile/verification?citizen_id=${citizenId}`);
}

// --- DigiLocker API ---
export async function authorizeDigilocker(citizenId: string) {
  return request<any>(`/api/digilocker/authorize?citizen_id=${citizenId}`, { method: 'POST' });
}

export async function digilockerCallback(state: string, code: string) {
  return request<any>(`/api/digilocker/callback?state=${state}&code=${code}`, { method: 'POST' });
}

// --- Applications API ---
export async function createApplication(data: any) {
  return request<any>(`/applications`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getApplications() {
  return request<any[]>(`/applications`);
}

export async function getApplication(applicationId: string) {
  return request<any>(`/applications/${applicationId}`);
}

// --- Documents API ---
export async function uploadDocument(formData: FormData) {
  // Use a custom fetch because we don't want Content-Type: application/json for FormData
  const url = `${API_BASE_URL}/api/documents/upload`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new ApiError(`HTTP Error: ${response.status}`, response.status);
  }
  return response.json();
}

export async function extractDocument(documentId: string) {
  return request<any>(`/api/documents/${documentId}/extract`, { method: 'POST' });
}

export async function getApplicationDocuments(applicationId: string) {
  return request<any[]>(`/api/applications/${applicationId}/documents`);
}

// --- Health Check API ---
export async function runHealthCheck(applicationId: string) {
  return request<any>(`/api/health-check/${applicationId}`, { method: 'POST' });
}

export async function getHealthCheck(applicationId: string) {
  return request<any>(`/api/health-check/${applicationId}`);
}

// --- Mismatch API ---
export async function resolveMismatchPlan(mismatchId: string) {
  return request<any>(`/api/mismatch/${mismatchId}/resolve-plan`, { method: 'POST' });
}

export async function getMismatchPlan(mismatchId: string) {
  return request<any>(`/api/mismatch/${mismatchId}/resolve-plan`);
}

// --- Payment Diagnosis API ---
export async function startPaymentDiagnosis(data: { citizen_id: string; application_id?: string; reported_problem?: string }) {
  return request<any>(`/api/payment-diagnosis/start`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function answerDiagnosisQuestion(caseId: string, question: string, answer: string) {
  return request<any>(`/api/payment-diagnosis/${caseId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ question, answer }),
  });
}

export async function getPaymentDiagnosisCase(caseId: string) {
  return request<any>(`/api/payment-diagnosis/${caseId}`);
}

// --- Application Timeline API ---
export async function getApplicationTimeline(applicationId: string) {
  // If the endpoint exists, we fetch it. If not, it will return a 404 handled gracefully by our error handler.
  return request<any>(`/api/applications/${applicationId}/timeline`);
}

// --- Agent API ---
export async function agentChat(data: { session_id: string; message: string }) {
  return request<any>(`/api/agent/chat`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Auth API ---
export interface Operator {
  id: string;
  name: string;
  email: string;
  picture_url?: string | null;
  auth_provider: string;
}
export interface AuthResponse {
  token: string;
  operator: Operator;
}

export async function getAuthConfig() {
  return request<{ google_client_id: string }>(`/api/auth/config`);
}

/** Exchange a Google Identity Services ID token for a SORTED session. */
export async function googleSignIn(credential: string) {
  return request<AuthResponse>(`/api/auth/google`, {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export async function passwordLogin(email: string, password: string) {
  return request<AuthResponse>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function passwordSignup(name: string, email: string, password: string) {
  return request<AuthResponse>(`/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getCurrentOperator() {
  return request<Operator>(`/api/auth/me`);
}
