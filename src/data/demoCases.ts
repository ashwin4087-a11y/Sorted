import { CitizenCase } from '../types';
import { runHealthCheck } from '../engine/healthCheckEngine';
import { diagnoseDBTFailure } from '../engine/diagnoser';
import { compileActions } from '../engine/actionCompiler';

// 1. Golden Demo: Lakshmi (62, Tamil speaker, PM-KISAN DBT payment failure)
const lakshmiDocs = [
  {
    id: 'DOC-LAKSHMI-AADHAAR',
    docType: 'AADHAAR' as const,
    name: 'Aadhaar Card (Lakshmi K)',
    number: '381249568912',
    holderName: 'Lakshmi K',
    dob: '1964-06-12',
    address: '14, South Street, Thiruvaiyaru, Thanjavur, Tamil Nadu 613204',
    issueDate: '2016-04-10',
    verified: true
  },
  {
    id: 'DOC-LAKSHMI-PASSBOOK',
    docType: 'BANK_PASSBOOK' as const,
    name: 'Canara Bank Passbook',
    accountNumber: '1204101089234',
    bankName: 'Canara Bank (Thiruvaiyaru Branch)',
    ifsc: 'CNRB0001204',
    holderName: 'K. Lakshmi',
    seedingReported: 'NOT_OK' as const,
    verified: true
  },
  {
    id: 'DOC-LAKSHMI-ACK',
    docType: 'APPLICATION_ACK' as const,
    name: 'PM-KISAN Sanction Slip',
    number: 'TN-PMK-2026-99042',
    verified: true
  },
  {
    id: 'DOC-LAKSHMI-STATUS',
    docType: 'PFMS_STATUS' as const,
    name: 'PFMS Payment Status Screenshot',
    rawText: 'Payment Mode: Aadhaar | Status: Rejected by Bank | Reason Code: P-U1 (Aadhaar de-seeded in NPCI mapper)',
    verified: true
  }
];

const lakshmiDiagnosis = diagnoseDBTFailure({
  applicationApproved: true,
  paymentGenerated: true,
  paymentFailed: true,
  reportedReasonText: 'Payment Mode: Aadhaar | Reason Code: P-U1 (Aadhaar de-seeded in NPCI mapper)',
  hasDocumentProof: true,
  sourceDocName: 'PFMS Status Screenshot'
});

const lakshmiHealth = runHealthCheck('PM-KISAN', lakshmiDocs);
const lakshmiActions = compileActions(lakshmiDiagnosis, lakshmiHealth.ruleTraces);

export const LAKSHMI_CASE: CitizenCase = {
  id: 'CASE_LAKSHMI',
  caseRef: 'CASE-004821',
  createdDate: '14 OCT 2026',
  schemeName: 'PM-KISAN Samman Nidhi',
  citizenName: 'Lakshmi K',
  citizenAge: 62,
  language: 'ta',
  location: 'Thanjavur, Tamil Nadu',
  journey: 'POST_SUBMISSION_DBT_FAILURE',
  status: 'ACTION_READY',
  readinessPercentage: 42,
  documents: lakshmiDocs,
  extractedFacts: [
    {
      id: 'F-1',
      caseId: 'CASE_LAKSHMI',
      key: 'citizen_identity',
      label: 'Citizen Identity',
      value: 'Lakshmi K (Age 62)',
      provenance: 'VERIFIED',
      sourceDoc: 'Aadhaar Card',
      confidence: 'HIGH'
    },
    {
      id: 'F-2',
      caseId: 'CASE_LAKSHMI',
      key: 'scheme_status',
      label: 'Scheme Sanction',
      value: 'Approved (Sanction TN-PMK-2026-99042)',
      provenance: 'VERIFIED',
      sourceDoc: 'PM-KISAN Sanction Slip',
      confidence: 'HIGH'
    },
    {
      id: 'F-3',
      caseId: 'CASE_LAKSHMI',
      key: 'disbursement_failure',
      label: 'Disbursement Status',
      value: 'Returned / Rejected by Bank',
      provenance: 'VERIFIED',
      sourceDoc: 'PFMS Status Screenshot',
      confidence: 'HIGH'
    },
    {
      id: 'F-4',
      caseId: 'CASE_LAKSHMI',
      key: 'pfms_error_code',
      label: 'PFMS Failure Code',
      value: 'P-U1 (Aadhaar de-seeded)',
      provenance: 'VERIFIED',
      sourceDoc: 'PFMS Status Screenshot',
      confidence: 'HIGH'
    },
    {
      id: 'F-5',
      caseId: 'CASE_LAKSHMI',
      key: 'bank_npci_mapping',
      label: 'NPCI DBT Mapping',
      value: 'INACTIVE / DE-SEEDED in Canara Bank',
      provenance: 'USER_REPORTED',
      sourceDoc: 'Citizen Statement',
      confidence: 'MEDIUM'
    }
  ],
  ruleTraces: lakshmiHealth.ruleTraces,
  diagnosis: { ...lakshmiDiagnosis, caseId: 'CASE_LAKSHMI' },
  actions: lakshmiActions.map(a => ({ ...a, caseId: 'CASE_LAKSHMI' })),
  events: [
    {
      id: 'EV-1',
      caseId: 'CASE_LAKSHMI',
      timestamp: '14 OCT 2026 · 10:14',
      eventType: 'CASE_CREATED',
      title: 'Case Registered on SORTED Terminal',
      description: 'Lakshmi reported non-receipt of two consecutive PM-KISAN instalments.',
      actor: 'CITIZEN'
    },
    {
      id: 'EV-2',
      caseId: 'CASE_LAKSHMI',
      timestamp: '14 OCT 2026 · 10:16',
      eventType: 'DOCUMENT_UPLOADED',
      title: 'Aadhaar and Bank Passbook Processed',
      description: 'Extracted Aadhaar 3812-XXXX-8912 and Canara Bank A/C 1204XXXX89234.',
      actor: 'SORTED_AI'
    },
    {
      id: 'EV-3',
      caseId: 'CASE_LAKSHMI',
      timestamp: '14 OCT 2026 · 10:18',
      eventType: 'DIAGNOSIS_PERFORMED',
      title: 'PFMS Diagnostic Code P-U1 Confirmed',
      description: 'Deterministic match against PFMS DBT error taxonomy: Aadhaar de-seeded.',
      actor: 'PFMS_ENGINE'
    },
    {
      id: 'EV-4',
      caseId: 'CASE_LAKSHMI',
      timestamp: '14 OCT 2026 · 10:19',
      eventType: 'LETTER_GENERATED',
      title: 'Official Bank Mandate Letter Generated',
      description: 'Prepared dual-language (Tamil / English) Aadhaar seeding requisition with Annexure I.',
      actor: 'SORTED_AI'
    }
  ]
};

// 2. Pre-Submission Prevention Demo: Lakshmi (Name Mismatch)
const lakshmiPreDocs = [
  {
    id: 'DOC-LAKSHMI-PRE-AADHAAR',
    docType: 'AADHAAR' as const,
    name: 'Aadhaar Card (Lakshmi Devi)',
    number: '381249568912',
    holderName: 'Lakshmi Devi',
    dob: '1964-06-12',
    address: '14, South Street, Thiruvaiyaru, Thanjavur, Tamil Nadu 613204',
    verified: true
  },
  {
    id: 'DOC-LAKSHMI-PRE-PASSBOOK',
    docType: 'BANK_PASSBOOK' as const,
    name: 'Bank Passbook',
    accountNumber: '1204101089234',
    bankName: 'Canara Bank',
    ifsc: 'CNRB0001204',
    holderName: 'Lakshmi D',
    seedingReported: 'OK' as const,
    verified: true
  }
];

const lakshmiPreHealth = runHealthCheck('General Pension', lakshmiPreDocs);
const lakshmiPreActions = compileActions(undefined, lakshmiPreHealth.ruleTraces);

export const LAKSHMI_PRE_CASE: CitizenCase = {
  id: 'CASE_LAKSHMI_PRE',
  caseRef: 'CASE-009988',
  createdDate: '14 OCT 2026',
  schemeName: 'General Pension Application',
  citizenName: 'Lakshmi Devi',
  citizenAge: 62,
  language: 'ta',
  location: 'Thanjavur, Tamil Nadu',
  journey: 'PRE_SUBMISSION_HEALTH_CHECK',
  status: 'CITIZEN_ACTION_REQUIRED',
  readinessPercentage: 50,
  documents: lakshmiPreDocs,
  extractedFacts: [
    {
      id: 'FLP-1',
      caseId: 'CASE_LAKSHMI_PRE',
      key: 'name_identity',
      label: 'Applicant Name',
      value: 'Lakshmi Devi',
      provenance: 'VERIFIED',
      sourceDoc: 'Aadhaar',
      confidence: 'HIGH'
    }
  ],
  ruleTraces: lakshmiPreHealth.ruleTraces,
  actions: lakshmiPreActions.map(a => ({ ...a, caseId: 'CASE_LAKSHMI_PRE' })),
  events: [
    {
      id: 'EVLP-1',
      caseId: 'CASE_LAKSHMI_PRE',
      timestamp: '14 OCT 2026 · 11:02',
      eventType: 'CASE_CREATED',
      title: 'Pre-Submission Verification Initiated',
      description: 'Applicant uploaded Aadhaar and Bank Passbook.',
      actor: 'CITIZEN'
    },
    {
      id: 'EVLP-2',
      caseId: 'CASE_LAKSHMI_PRE',
      timestamp: '14 OCT 2026 · 11:03',
      eventType: 'DOCUMENTS_CHECKED',
      title: 'Documents Scanned and Checked',
      description: 'Extracted normalized fields for cross-verification.',
      actor: 'SORTED_AI'
    },
    {
      id: 'EVLP-3',
      caseId: 'CASE_LAKSHMI_PRE',
      timestamp: '14 OCT 2026 · 11:03',
      eventType: 'MISMATCH_DETECTED',
      title: 'Potential Name Mismatch Detected',
      description: 'Aadhaar (Lakshmi Devi) conflicts with Bank Record (Lakshmi D).',
      actor: 'SORTED_AI'
    },
    {
      id: 'EVLP-4',
      caseId: 'CASE_LAKSHMI_PRE',
      timestamp: '14 OCT 2026 · 11:03',
      eventType: 'HEALTH_CHECK_COMPLETED',
      title: 'Health Check Completed',
      description: 'System blocked application due to unverified name discrepancy.',
      actor: 'SORTED_AI'
    },
    {
      id: 'EVLP-5',
      caseId: 'CASE_LAKSHMI_PRE',
      timestamp: '14 OCT 2026 · 11:03',
      eventType: 'CITIZEN_ACTION_MARKED',
      title: 'Fix Passport Generated',
      description: 'Created step-by-step action plan to resolve name mismatch before filing.',
      actor: 'SORTED_AI'
    }
  ]
};
