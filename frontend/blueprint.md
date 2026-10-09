# SORTED: Project Blueprint

**Tagline:** Diagnose. Automate. Resolve.
**Category:** AI automation / GovTech
**Status:** v1, October 2026. This is the build reference. If the team disagrees about a feature, a claim to judges, or what Sorted does, this file decides.

---

## 1. Product in one paragraph

Sorted is an AI agent for the **last mile of government benefits**. It helps a citizen prevent, diagnose and resolve the problems that happen between "I applied" and "the money arrived": document mismatches before submission, and documented payment-failure reasons after it. It turns each problem into a diagnosis, an exact next action, a ready-to-use letter, and a tracked case.

**Pitch line:** *myScheme tells you what you're eligible for. Sorted makes sure you actually get it.*

**Core loop:** `understand → diagnose → explain → generate action → track → follow up → resolve`

## 2. Why this problem (research summary)

- **Discovery is already covered.** The government's myScheme platform provides scheme discovery, an eligibility check and application guidance. We do not rebuild it; we link to it. (Verify the current scheme count and chatbot features on the official FAQ before quoting figures on a slide. Sources found so far say 4,000+ schemes.)
- **Rejections are dominated by fixable data problems.** Reported examples: West Bengal's 2026 Annapurna rollout rejected about 17 lakh applications at initial verification, roughly 10 lakh of them because Aadhaar couldn't be linked to the bank account; a Haryana DAYALU claim was rejected over an age mismatch between a death certificate and the family ID, which the state rights commission called a clerical error; name mismatches with Aadhaar recur in PMAY subsidy rejections.
- **Citizens can't diagnose payment failures.** Research on DBT found Aadhaar-related errors behind roughly half of affected farmers' failures, and beneficiaries ran from office to office just to learn the cause. PFMS publishes a finite table of validation/payment failure reasons with remedies, which makes the problem automatable.
- **After submission it's a black box.** Reports describe applicants who never learn whether they were accepted or rejected, and repeated visits with new document requests.
- **Caveats:** evidence is news reports, a government table and some commercial blogs, not a rigorous survey. Some items are dated (2017, 2019). Reported rejection counts differ between sources. Treat the pattern as solid and numbers as indicative. If possible, interview one CSC operator.

## 3. What Sorted is not (and claims we never make)

Sorted is **not**: a generic chatbot, a scheme directory, a replacement for myScheme, a fake government portal, a system with access to private government databases, a system that silently submits applications, a guarantee of approval or payment, or an AI that makes unexplained eligibility decisions.

**Never claim:**
- "We are integrated with PFMS / NPCI" (unless we truly are).
- "We automatically submit government applications."
- "AI guarantees eligibility" or "this will guarantee payment."

**Say instead:** "Sorted diagnoses the reported failure and guides the citizen through the documented corrective action."

**Demo labelling:** all simulated data is marked `DEMO DATA`; the portal used for Form Autopilot is marked `MOCK / DEMONSTRATION PORTAL`.

**Feature test.** Before adding any feature, ask whether it helps Sorted (1) diagnose a real benefit problem, (2) prevent a real failure, (3) automate a corrective action, (4) reduce unnecessary citizen effort, or (5) track a case to resolution. If the answer is no to all five, don't build it.

## 4. Users and journeys

**Primary user:** a citizen, often with low digital literacy, who prefers a regional language. **Assisted users:** CSC operators, NGO workers, volunteers (later). **Institutional (future):** departments studying recurring failure patterns, subject to privacy and governance.

**Journey A: before submission** ("I want to apply without being rejected")
`conversation → profile extraction → document upload → field extraction → cross-document validation → Health Check → issues → fix plan → readiness`

**Journey B: after submission** ("I applied but my money hasn't arrived")
`conversation → application context → status/failure information → diagnosis → known failure category → exact remedy → action + letter → follow-up → resolution`

## 5. Feature priorities

**P0 (must build)**
1. Pre-submission **Health Check** (name, DOB, address, expiry, missing documents, citizen-reported Aadhaar/bank result).
2. **DBT Failure Diagnoser** ("Why didn't my money come?"), driven by the taxonomy in section 8.
3. **Action Engine** (problem → remedy, steps, what to carry, where to go, document, follow-up).
4. **Mismatch Resolver** (what differs, where, what supporting document may be needed). It does not declare one document legally superior; it says the issuing authority, bank or department must confirm.
5. **Case Tracker** with the state machine in section 10.
6. **Tamil and English text chat** (Hindi if time allows).

**P1 (high value)**
- **Letter generator:** bank request, scheme-department request, "ask department for my payment return reason," correction request, follow-up, escalation draft, document checklist. All marked *AI-generated draft: verify before submission.*
- **One-Trip Planner:** group required actions by destination so the citizen makes as few visits as possible.
- **Form Autopilot** on the mock portal (stops at review; citizen approves).
- **Status tracker** from pasted SMS, screenshot text, acknowledgement or reference number.

**P2 (optional)**
Voice in/out, time-travel eligibility, proactive benefit discovery, CSC/operator dashboard, analytics, notification integrations.

**Do not build:** a 4,000-scheme database, real PFMS/NPCI integration, a full portal, predictive ML, blockchain, generic dashboards. Depth beats breadth.

## 6. Design principles

1. **The LLM talks; deterministic rules decide.** The LLM does language understanding, extraction, questions, explanation and drafting. It is never the source of truth for eligibility rules, failure codes, official remedies, document requirements, legal conclusions, or government/NPCI/PFMS status.
2. **AI prepares, citizen authorizes.** Consequential actions need citizen review and approval.
3. **Never fabricate a status.** Every fact is tagged `VERIFIED` (official document or status supplied), `USER_REPORTED`, `INFERRED`, or `UNKNOWN`.
4. **Say UNKNOWN rather than guess,** and ask for the missing information.
5. **Minimum data.** Never ask for OTPs, passwords or a full Aadhaar number when a masked one will do.
6. **Language is the communication layer only;** it never changes business rules.

## 7. Health Check engine

**Pipeline:** `document → OCR/extraction (LLM allowed) → structured fields → rule engine → result → LLM explanation`. The rule engine, not the LLM, makes the call.

**Overall output:** `READY | WARNING | BLOCKED | UNKNOWN`

| Rule | Possible results | Notes |
|---|---|---|
| `NAME_MATCH` | MATCH, MINOR_VARIATION, POSSIBLE_MISMATCH, MISMATCH, UNKNOWN | Normalize case, spacing, punctuation, honorifics, initials, common transliteration variants; fuzzy score with thresholds. Don't assume every variation is acceptable. |
| `DOB_MATCH` | MATCH, MISMATCH, MISSING, UNKNOWN | Compare normalized dates; flag year-only differences distinctly. |
| `ADDRESS_CONSISTENCY` | CONSISTENT, POSSIBLE_VARIATION, MISMATCH, UNKNOWN | Variation is a warning, not an automatic rejection. |
| `DOCUMENT_EXPIRY` | VALID, EXPIRING_SOON, EXPIRED, UNKNOWN | Issue date, expiry date, today. |
| `REQUIRED_DOCUMENT` | PRESENT, MISSING, UNCLEAR | Against the scheme's document list. |
| `DUPLICATE_RECORD` | NONE, POTENTIAL_DUPLICATE | Wording: "Potential duplicate detected." Never imply fraud. |
| `AADHAAR_FORMAT` | VALID, INVALID | 12 digits and the UIDAI checksum (Verhoeff), computed locally. |
| `AADHAAR_BANK_SEEDING` | USER_REPORTED_OK / USER_REPORTED_NOT_OK / UNKNOWN | Citizen checks through the official channel and reports the result. Sorted does not query NPCI. |

## 8. DBT Failure Diagnoser

### Flow

```text
PAYMENT NOT RECEIVED
  → application approved?
  → payment generated?
  → payment failed / returned?
  → do you have a failure reason / message?
  → normalize reason → match taxonomy → return remedy
  → insufficient evidence → UNKNOWN → ask another question
```

Never jump straight from "money didn't arrive" to "your Aadhaar isn't seeded."

### Confidence and provenance

Each diagnosis stores `diagnosis, evidence, evidence_source, confidence, taxonomy_source, next_action`.
- Confidence **HIGH** requires a verified source (uploaded screenshot or document showing the reason).
- A reason only typed by the citizen caps at **MEDIUM**.
- An inferred cause with no stated reason is **LOW** and always paired with "verify the payment failure reason."

### UNKNOWN path (important)

The failure reasons below are what the *department* sees in PFMS; citizens often don't have them. When the reason is unknown, the default action is a generated letter asking the scheme department or block office for the **payment return/rejection reason**, plus a checklist of what to carry.

### Taxonomy (derived from the official PFMS table "DBT Validation/Payment Error/Rejection and action thereon")

`responsible` is who must act; `destination` is where the citizen takes the action. Store `source_url` and `retrieved_at` on every row; re-check the source before launch.

| ID | Stage | Reason | Remedy | Responsible | Destination |
|---|---|---|---|---|---|
| V-A1 | Validation, account | Account number invalid (rejected by bank) | Provide valid bank account to scheme department | Citizen | Department |
| V-A2 | Validation, account | Invalid IFSC | Provide valid IFSC | Citizen | Department |
| V-A3 | Validation, account | Account does not exist | Provide valid bank account | Citizen | Department |
| V-A4 | Validation, account | Account closed | Provide valid bank account | Citizen | Department |
| V-A5 | Validation, account | Blocked account | Provide valid bank account | Citizen | Department |
| V-A6 | Validation, account | Invalid account, validation pending 6 months | Contact bank branch for KYC update | Citizen | Bank |
| V-A7 | Validation, account | Bank name and IFSC not related | Provide valid bank branch details | Citizen | Department |
| V-A8 | Validation, account | UID and account both invalid | Provide valid bank account | Citizen | Department |
| V-A9 | Validation, account | Bank inactive / merged | Provide valid (current) bank account | Citizen | Department |
| V-A10 | Validation, account | UID disabled for DBT and account closed | (1) Bank: Aadhaar seeding + NPCI mapper update; (2) provide valid bank account to department | Citizen | Bank + Department |
| V-U1 | Validation, Aadhaar | Aadhaar not 12 digits / fails UIDAI algorithm | Department obtains correct Aadhaar from beneficiary | Department (citizen supplies) | Department |
| V-U2 | Validation, Aadhaar | Aadhaar not seeded in NPCI | Bank: Aadhaar seeding + NPCI mapper update | Citizen | Bank |
| V-U3 | Validation, Aadhaar | UID and account both invalid | Provide valid bank account | Citizen | Department |
| V-U4 | Validation, Aadhaar | UID disabled for DBT | Bank: seeding + NPCI mapper update | Citizen | Bank |
| V-U5 | Validation, Aadhaar | UID never enabled for DBT | Bank: seeding + NPCI mapper update | Citizen | Bank |
| V-U6 | Validation, Aadhaar | UID cancelled by UIDAI | Provide valid Aadhaar details | Citizen | Department |
| P-A1 | Payment, account | Account marked invalid in PFMS | Provide valid bank account | Citizen | Department |
| P-A2 | Payment, account | Both account and Aadhaar invalid | Provide valid Aadhaar **and** bank account | Citizen | Department |
| P-A3 | Payment, account | IFSC invalid | Provide valid bank account | Citizen | Department |
| P-A4 | Payment, account | Account holder expired | Banks must update NPCI mapper as inactive | **Bank** | Bank |
| P-A5 | Payment, account | Invalid account | Contact bank branch for KYC update | Citizen | Bank |
| P-A6 | Payment, account | Rejected by bank, account number invalid | Provide valid bank account | Citizen | Department |
| P-A7 | Payment, account | Rejected by bank, account closed | Provide valid bank account | Citizen | Department |
| P-U1 | Payment, Aadhaar | Aadhaar de-seeded | Bank: seeding + NPCI mapper update | Citizen | Bank |
| P-U2 | Payment, Aadhaar | Both account and Aadhaar invalid | Provide valid Aadhaar **and** bank account | Citizen | Department |
| P-U3 | Payment, Aadhaar | UID disabled for DBT | Bank: seeding + NPCI mapper update | Citizen | Bank |
| P-U4 | Payment, Aadhaar | UID cancelled by UIDAI | Provide valid Aadhaar details | Citizen | Department |

Notes: "UID and account both invalid" has a different remedy at the validation stage (bank account only) than at the payment stage (Aadhaar and bank account). P-A4 (account holder expired) is a bank-side action; the letter should be a notification/request from the family, and the tone must be handled sensitively.

### NPCI limitation (state it to judges)

Sorted cannot query a citizen's NPCI seeding status. It guides the citizen to check through the official channel, accepts the result (typed or screenshot), and automates everything around it.

## 9. Action Engine and letters

Every issue produces: `problem → why it matters → exact next action → what to carry → where to go → document generated → follow-up`.

**Action compiler output (example):**

```json
{
  "issue": "P-U1",
  "severity": "BLOCKING",
  "responsible_party": "CITIZEN",
  "destination": "BANK",
  "actions": ["CONTACT_BANK", "REQUEST_AADHAAR_SEEDING", "REQUEST_NPCI_MAPPER_UPDATE", "OBTAIN_ACKNOWLEDGEMENT"],
  "carry": ["Aadhaar", "Passbook", "Application acknowledgement"],
  "artifacts": ["BANK_REQUEST_LETTER"],
  "follow_up": { "required": true, "reminder_days": [3, 7] }
}
```

**Letter templates:** bank request, department correction request, "request payment return reason," KYC update request, follow-up, escalation draft. Each is generated in the citizen's language, filled from case fields, and carries the draft notice.

**One-Trip Planner:** build the dependency graph of pending actions, topologically sort, group by destination, and output a printable "Visit 1: what to carry, what to ask for" page.

## 10. Case state machine and automation

```text
NEW → UNDERSTANDING → DIAGNOSED → ACTION_READY → CITIZEN_ACTION_REQUIRED
    → SUBMITTED → WAITING → FOLLOW_UP_REQUIRED → ESCALATED → RESOLVED
    (side state: NEEDS_INFO when diagnosis is UNKNOWN)
```

`UNKNOWN` is a diagnosis result, not a case state.

**Event → Rule → Action → Wait → Check → Next action.** Everything runs through an `events` table so every change is auditable and replayable:

```text
Bank letter generated → citizen marks "submitted" → case = WAITING
  → day 3: reminder → day 7: ask for updated status
  → still unresolved: generate follow-up letter → escalation draft
```

Events: document uploaded, fact changed, status pasted, citizen marked done, deadline passed, simulated government event (labelled).
Application readiness = `completed required actions / total required actions`.

## 11. Conversation and AI layer

- **Slot-filling agent:** ask the next question that most narrows the diagnosis (e.g., "Did you get an approval message? Is there any payment failed/returned status? Any bank or Aadhaar error message?").
- **Structured extraction:** JSON-schema output validated with Pydantic; every extracted fact stores source and provenance tag.
- **Multilingual:** Tamil and English first. Detect language, extract facts, respond in the user's language; confirm important facts back ("You said ...; is that right?").
- **"Why am I being asked this?"** on every question.
- **Provider adapter:** one interface over Gemini (primary) and Groq (fallback); cache repeated calls.

## 12. Architecture

```text
Citizen (PWA, text/voice)
   → Conversation API (FastAPI)
   → LLM/NLU adapter → Case model
        ├─ Health Check engine ┐
        └─ DBT Diagnoser       ├→ Action Engine → Automation Engine
                               ┘        ├─ Letters/Artifacts
                                        ├─ Reminders
                                        └─ Case timeline/tracker
   Postgres (cases, facts, rules, events) · file storage (documents)
```

**Why a state machine, not a free-running agent loop:** it is debuggable, can't drift, and can't derail a live demo. The LLM runs inside each state with structured output.

## 13. Data model

Core tables: `citizens`, `cases`, `documents`, `document_fields` (value, provenance, confidence), `issues`, `rules` (versioned, with source metadata), `taxonomy_entries`, `diagnoses`, `actions`, `artifacts`, `tasks`, `events`, `status_events`, `sources`, `audit_log`.

**Knowledge-base entries carry metadata:**

```json
{
  "id": "P-U1",
  "source_name": "PFMS: DBT Validation/Payment Error/Rejection and action thereon",
  "source_type": "official",
  "source_url": "",
  "retrieved_at": "",
  "effective_date": "",
  "reason": "",
  "remedy": "",
  "responsible_party": "",
  "destination": "",
  "version": 1
}
```

**Source hierarchy when sources conflict:** official department > official portal > official documentation/API > official scheme guidelines > reputable reporting > research > commercial blogs > general web > LLM knowledge. Lower levels never silently override higher ones.

## 14. API

```text
POST /api/conversations                 start/continue a conversation (text, optional audio)
POST /api/cases                         create case
GET  /api/cases/:id                     case with issues, diagnoses, actions
POST /api/documents                     upload + extract (multipart)
POST /api/health-check                  run checks for a case
POST /api/diagnose                      run DBT diagnosis
POST /api/actions                       compile action plan
POST /api/artifacts                     generate letter/checklist
POST /api/events                        add case event (citizen done, status pasted, simulated)
GET  /api/timeline/:caseId              case timeline
GET  /health                            health ping (free tiers sleep)
```

## 15. Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind, shadcn/ui; installable PWA.
- **Backend:** FastAPI (async, Pydantic validation, strong ML/OCR ecosystem).
- **DB/storage:** PostgreSQL on Supabase (JSONB for flexible rule and fact data).
- **LLM:** Gemini free tier (primary), Groq (fallback) behind one adapter.
- **OCR:** Tesseract with Indic language packs, or Gemini vision.
- **Letters/PDF:** `reportlab` or `pypdf`.
- **Jobs/reminders:** APScheduler to start.
- **Notifications:** email (Resend); WhatsApp/SMS sandbox for the demo only.
- **Deploy:** Vercel (web), Render or Railway (API), Supabase (DB, storage). GitHub Actions for lint and tests.

## 16. UI/UX

- **Start with the citizen's problem**, not a dashboard.
- Chat with a live "case understanding" side panel: facts appear as chips with provenance badges.
- **Diagnosis card:** diagnosis, evidence, confidence, source, next action.
- **Rule trace drawer** per Health Check result.
- **Case timeline** like parcel tracking: problem identified → remedy identified → letter generated → visit → acknowledgement → recheck.
- **Today screen:** "One thing to do today."
- Large touch targets, icons next to text, audio playback on messages, low-data mode, warm plain language.

## 17. Security and privacy

- Use **synthetic citizens and documents** for all demos.
- Store masked or hashed identifiers; don't store full Aadhaar numbers unless essential.
- Never request OTPs, passwords or credentials. Never accept an OTP in chat.
- Encrypt sensitive fields at rest; short-lived signed URLs for documents; consent screen; delete-on-request; audit log.
- Every automated action records who, what, why, supporting evidence, and whether the citizen reviewed it.

## 18. Folder structure

```text
sorted/
├── apps/
│   ├── web/                      # Next.js PWA
│   └── api/                      # FastAPI
│       ├── app/
│       │   ├── conversation/     # state machine, prompts
│       │   ├── healthcheck/      # rule modules, fuzzy matching
│       │   ├── diagnoser/        # taxonomy loader, decision flow
│       │   ├── actions/          # action compiler, one-trip planner
│       │   ├── artifacts/        # letter templates (i18n)
│       │   ├── automation/       # events, triggers, scheduler
│       │   ├── documents/        # OCR + extraction
│       │   ├── llm/              # adapter, gemini.py, groq.py
│       │   └── models/ schemas/ core/
│       └── tests/                # golden cases per taxonomy row
├── data/taxonomy/pfms.json
├── data/demo/                    # synthetic citizens and documents
├── mock-portal/                  # clearly labelled demo portal
├── docs/                         # ARCHITECTURE, FAILURE_TAXONOMY, DEMO_SCRIPT, DATA_POLICY, API_SPEC
├── docker-compose.yml
└── README.md
```

## 19. 24-hour roadmap

| Hours | Work |
|---|---|
| 0-3 | Repo, DB, deploy skeletons; load taxonomy JSON; define case/fact/event schemas |
| 3-7 | Health Check engine + tests (name, DOB, expiry, Aadhaar format) |
| 7-11 | DBT Diagnoser + confidence/provenance + UNKNOWN path |
| 11-14 | Action compiler + letter generation (bank, department, "ask return reason") |
| 14-17 | Case timeline, events table, reminder simulation |
| 17-20 | Tamil/English conversation, document extraction, UI polish |
| 20-22 | Demo data, mock portal, fallback recording |
| 22-24 | Testing, slides, rehearsal x3 |

**Feature freeze at hour 20.** **If time slips, cut in this order:** reminder simulation, mock portal, One-Trip Planner, then OCR (use typed fields). The diagnoser, Health Check and letters carry the demo; protect them.

## 20. Demo script (golden flow)

**Persona:** Lakshmi, 62, Tamil speaker. **All data is synthetic and labelled `DEMO DATA`.**

1. Lakshmi (Tamil): her application was approved three months ago and no money has come.
2. Sorted asks three short questions (approval message? failed/returned status? any bank/Aadhaar error?).
3. She reports an "Aadhaar not seeded" style status. Sorted matches the taxonomy row, shows evidence, confidence (MEDIUM, since user-reported) and the source.
4. Sorted explains the likely blocker and next action, and generates the **bank request letter** in Tamil, plus what to carry.
5. Case timeline shows: ✓ problem identified, ✓ remedy identified, ✓ letter generated, ○ bank visit, ○ acknowledgement, ○ recheck payment.
6. Second moment (prevention): upload Aadhaar, bank document and a death certificate for a new application. Health Check flags a DOB year mismatch between the certificate and the family record: "Fix this before submitting."
7. Optional: trigger a **simulated** status event (labelled) and show the case advancing.
8. Close with the one-liner.

Keep a pre-recorded fallback of the whole flow.

## 21. Two-minute pitch

> You're eligible for a government benefit. You apply, you wait for months, and the money never arrives. You don't know whether the application failed, the bank rejected the payment, or your documents don't match.
>
> That's where Sorted comes in. It doesn't replace scheme discovery; platforms like myScheme already do that. Sorted starts where they stop. It understands your problem in your own language, diagnoses known failure conditions using official failure categories, explains exactly what went wrong, generates the letter you need, and tracks the case until it's resolved.
>
> Before you submit, Sorted checks your documents for preventable mismatches. After you submit, it turns documented payment-failure reasons into a plan.
>
> Other systems tell you what to apply for. **Sorted helps you get unstuck.** Diagnose. Automate. Resolve.

## 22. Judge Q&A

- **Why not just use myScheme?** It already handles discovery and eligibility guidance well, so we don't compete. Sorted works around the application: diagnosing stuck benefits, preventing document problems, generating corrective actions, and tracking resolution.
- **Is the AI doing anything real?** Yes: multilingual conversation, extraction, document understanding, explanation, drafting. A deterministic engine handles classification and remedies, and the automation engine turns diagnoses into workflows.
- **How do you know the diagnosis is correct?** It's matched against a taxonomy derived from the official PFMS failure/remedy table. If evidence is insufficient, Sorted returns UNKNOWN and asks for more.
- **Can you access NPCI/PFMS?** Not in this prototype, and we don't fake it. The citizen verifies through the official channel and provides the result; Sorted automates around it.
- **What if the AI is wrong?** Facts are tagged verified/user-reported/inferred/unknown, confidence reflects provenance, and the citizen reviews every action. The AI cannot invent a failure reason or status.
- **What if rules change?** Rules live outside the LLM with source, version and effective date. Updating a row changes decisions without retraining anything.
- **Can this scale?** Conversation, extraction, rules, knowledge, workflows and case tracking are separate. A new scheme or failure category is a knowledge-base and workflow update.
- **Privacy?** Minimum data, masked identifiers, no OTPs, encryption at rest, consent and deletion, synthetic demo data.
- **Who is the customer?** Citizens first; CSC operators and NGOs as assisted users; departments later for aggregate failure patterns.
- **Business model?** Per-case or subscription for CSC networks and NGOs; institutional licensing to departments for resolution analytics.

## 23. Presentation outline (10 slides)

1. Title and tagline. 2. The problem (Lakshmi, plus cited figures). 3. Why existing tools stop short (discovery vs resolution). 4. Sorted overview (diagnose, automate, resolve). 5. Live demo. 6. How it works ("LLM talks, rules decide"). 7. Trust: provenance, UNKNOWN, human approval, honest limits. 8. Architecture and stack. 9. Impact, metrics and business model. 10. Roadmap and ask.

**Product metrics:** case resolution rate, actionability rate, time to diagnosis, average citizen visits per case, document-error detection rate, follow-up completion rate.

## 24. README outline

Title and badges · one-line pitch · demo GIF/link · what it is and is not · features · architecture diagram · taxonomy and sources · tech stack · quick start (`docker compose up`) · environment variables · adding a taxonomy row or health-check rule · running tests · API docs · privacy and data policy · roadmap · disclaimer (not official government advice; demo data is synthetic) · team · license.

## 25. Resume description

> **Sorted: AI Agent for Government-Benefit Failure Resolution** | FastAPI, PostgreSQL, Next.js, Gemini
> Built a multilingual agent that diagnoses preventable application issues and documented DBT payment failures. Implemented a deterministic Health Check engine (fuzzy name matching, DOB/expiry checks, Aadhaar checksum), a taxonomy-driven diagnoser derived from official PFMS failure/remedy tables with provenance-based confidence, an action compiler that generates language-localized corrective letters, and an event-driven case tracker with reminders.

## 26. To verify before launch

- Re-fetch the PFMS table and record `retrieved_at` and any revision date for every taxonomy row.
- Confirm current myScheme figures and features from its official FAQ before quoting them.
- Confirm the official channel and exact steps for a citizen to check Aadhaar-bank seeding status.
- Confirm the scheme-specific document list for each demo scheme from official guidelines.
- Interview at least one CSC operator or past applicant about how failures actually surface to citizens.
- Have a Tamil speaker review all Tamil prompts and letters.
