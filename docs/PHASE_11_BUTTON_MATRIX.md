# PHASE 11: FRONTEND BUTTON & ACTION MATRIX

This matrix tracks every interactive element on the frontend and its required integration state.

| Component | Element / Button | Intended Action | Current Status | Integration Required |
|-----------|------------------|-----------------|----------------|----------------------|
| `App.tsx` | Main Nav Tabs | Switch views | Works (Local State) | Bind to global app router or robust context. |
| `App.tsx` | "Lakshmi" Toggles | Switch demo case | FAKE | **REMOVE**. Replace with a Citizen/App selector. |
| `App.tsx` | "RESET DEMO" | Clear local storage | FAKE | **REMOVE**. |
| `EntryScreen.tsx` | Journey Buttons | Start a flow | Works (Local State) | Connect to actual creation of a Citizen/Session. |
| `SchemeDiscovery.tsx`| Search Input | Filter scheme list | Real API | Works fine. |
| `SchemeDiscovery.tsx`| "Start Pre-Submission Check" | Go to Health Check for Scheme | **BROKEN** (No `onClick`) | Must transition to App creation -> Health Check view with selected `schemeId`. |
| `OperatorConsole.tsx`| Language Toggle | Switch UI language | Local State | Update chat state accordingly. |
| `OperatorConsole.tsx`| Quick Prompts | Auto-fill chat | Local State | Works fine. |
| `OperatorConsole.tsx`| "SUBMIT" | Send chat to agent | **BROKEN** | Update `/api/operator` to `/api/agent/chat`. |
| `PreSubmissionCheck` | "UPLOAD DOCUMENT" | Open file picker -> Upload | **BROKEN** (No `onClick`) | Implement real file `<input>` -> `/api/documents/upload`. |
| `PreSubmissionCheck` | Trace Expanders | Show details | Works (Local State) | - |
| `DBTDiagnoser` | "START DIAGNOSIS" | Initialize diagnosis session | **Partial** | Uses dummy Citizen ID. Need to pass real ID. |
| `DBTDiagnoser` | "Yes/No/Unknown" | Submit answer to diagnoser | **Partial** | Wired to API, but uses hardcoded initial case. |
| `DBTDiagnoser` | Taxonomy Search/Expand| Browse taxonomy | Works (Local State) | - |
| `DBTDiagnoser` | "APPLY" Taxonomy | Force diagnosis result | Works (Local State) | Update the actual API state or transition to Planner. |
| `GeneratedArtifacts` | "PRINT DOCUMENT" | Print letter | Local State (window.print) | Should be fine. |
| `GeneratedArtifacts` | "MARK AS DELIVERED"| Mark step done | Local State | Wire to Application Timeline/Events. |
| `OneTripPlanner` | "MARK AS COMPLETED" | Strike off task | Local State | Wire to Application Timeline/Events. |

## Action Plan
We must systematically eliminate the "FAKE" and "BROKEN" statuses, swapping out `demoCases.ts` for real API data fetching where required.
