# Phase 2 API Integration

| Frontend Feature | API Endpoint | HTTP Method | Status |
| --- | --- | --- | --- |
| Scheme Search | `/api/schemes` | GET | CONNECTED |
| Scheme Details | `/api/schemes/{id}` | GET | CONNECTED |
| Application Creation | `/applications` | POST | CONNECTED |
| Application List | `/applications` | GET | CONNECTED |
| Application Fetch | `/applications/{id}` | GET | CONNECTED |
| Document Upload | `/api/documents/upload` | POST | CONNECTED |
| Document Extraction | `/api/documents/{id}/extract` | POST | CONNECTED |
| Application Docs | `/api/applications/{id}/documents` | GET | CONNECTED |
| Run Health Check | `/api/health-check/{id}` | POST | CONNECTED |
| Get Health Check | `/api/health-check/{id}` | GET | CONNECTED |
| Start Payment Diagnosis | `/api/payment-diagnosis/start` | POST | CONNECTED |
| Answer Diagnosis Question | `/api/payment-diagnosis/{case_id}/answer` | POST | CONNECTED |
| Get Payment Case | `/api/payment-diagnosis/{case_id}` | GET | CONNECTED |
| Mismatch Resolution Plan | `/api/mismatch/{mismatch_id}/resolve-plan` | POST | CONNECTED |
| Get Mismatch Plan | `/api/mismatch/{mismatch_id}/resolve-plan` | GET | CONNECTED |
| Timeline Events | `/api/applications/{id}/timeline` | GET | CONNECTED |

*Note: Since the backend lacks explicit seed data in Phase 2 for the synthetic Lakshmi demo, API calls use fallback strategies and graceful 404 handling. The `api.ts` client is fully configured to route frontend interactions to these backend endpoints.*
