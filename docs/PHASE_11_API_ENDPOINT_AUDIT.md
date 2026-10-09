# PHASE 11: API ENDPOINT AUDIT

This document provides a comprehensive inventory of all available backend API endpoints and their current status of integration with the React frontend.

## 1. Schemes API (`/api/schemes`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/schemes` | GET | **Yes** | Used in `SchemeDiscovery.tsx`. |
| `/api/schemes/{scheme_id}` | GET | **No** | Needs to be wired for scheme detail view. |

## 2. Citizens API (`/api/citizens`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/citizens` | POST | **No** | Required to create a real citizen instead of mock. |
| `/api/citizens` | GET | **No** | |
| `/api/citizens/{citizen_id}` | GET | **No** | |

## 3. Applications API (`/api/applications`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/applications` | POST | **No** | Required for creating a scheme application. |
| `/api/applications` | GET | **No** | |
| `/api/applications/{application_id}` | GET | **No** | |

## 4. Documents API (`/api/documents`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/documents/upload` | POST | **No** | Needs wiring in `PreSubmissionHealthCheck.tsx` "Upload" button. |
| `/api/documents/{document_id}/extract` | POST | **No** | Must be triggered after upload to OCR facts. |
| `/api/documents/{document_id}` | GET | **No** | |
| `/api/documents/{document_id}/download` | GET | **No** | Secured download endpoint. |
| `/api/applications/{app_id}/documents` | GET | **No** | |
| `/api/documents/{document_id}` | DELETE | **No** | |

## 5. Health Check API (`/api/health-check`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/health-check/{app_id}` | POST | **Partial** | Uses dummy hardcoded ID (`00000...00000`). |
| `/api/health-check/{app_id}` | GET | **No** | |

## 6. Payment Diagnosis API (`/api/payment-diagnosis`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/start` | POST | **Partial** | Uses dummy citizen ID. |
| `/{case_id}/answer` | POST | **Yes** | Fully wired up to the interactive diagnoser. |
| `/{case_id}` | GET | **No** | |

## 7. Mismatch Plan API (`/api/mismatch`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/{mismatch_id}/resolve-plan` | POST | **No** | Needs wiring in One-Trip Planner/Generated Letters. |
| `/{mismatch_id}/resolve-plan` | GET | **No** | |

## 8. Agent API (`/api/agent`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/api/agent/chat` | POST | **No** | `OperatorConsole.tsx` tries to call non-existent `/api/operator`. |

## 9. System API (`/health`)
| Endpoint | Method | Frontend Integrated | Notes |
|----------|--------|---------------------|-------|
| `/health` | GET | **N/A** | Used for deployment checks. |

## Conclusion
The backend is highly capable and ready, but the frontend is severely lacking in actual wiring. Most interactive flows (Upload, Scheme Selection, Agent Chat) are blocked by hardcoded demo IDs or missing onClick handlers.
