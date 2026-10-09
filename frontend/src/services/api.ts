export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new ApiError(`HTTP Error: ${response.status}`, response.status);
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
    throw new Error('Network or unexpected error. Please try again.');
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
