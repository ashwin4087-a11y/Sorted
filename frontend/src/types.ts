/**
 * SORTED — Types & Data Structures
 * Strictly typed government-benefit resolution model
 */

export type ProvenanceType = 'VERIFIED' | 'USER_REPORTED' | 'INFERRED' | 'UNKNOWN';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus = 
  | 'NEW'
  | 'UNDERSTANDING'
  | 'DIAGNOSED'
  | 'ACTION_READY'
  | 'CITIZEN_ACTION_REQUIRED'
  | 'SUBMITTED'
  | 'WAITING'
  | 'FOLLOW_UP_REQUIRED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'NEEDS_INFO';

export const getResolutionProgress = (status: CaseStatus): number => {
  switch (status) {
    case 'NEW': return 0;
    case 'UNDERSTANDING': return 20;
    case 'NEEDS_INFO': return 30;
    case 'DIAGNOSED': return 40;
    case 'ACTION_READY': return 60;
    case 'CITIZEN_ACTION_REQUIRED': return 60;
    case 'SUBMITTED': return 75;
    case 'WAITING': return 85;
    case 'FOLLOW_UP_REQUIRED': return 85;
    case 'ESCALATED': return 90;
    case 'RESOLVED': return 100;
    default: return 0;
  }
};

export const getStatusColor = (status: CaseStatus): string => {
  switch (status) {
    case 'ACTION_READY':
    case 'CITIZEN_ACTION_REQUIRED':
    case 'FOLLOW_UP_REQUIRED':
    case 'NEEDS_INFO':
      return 'text-[#F4B942]'; // Amber
    case 'RESOLVED':
      return 'text-[#56A67A]'; // Green
    case 'ESCALATED':
      return 'text-[#C95C5C]'; // Red
    default:
      return 'text-[#123B63]'; // Industrial Navy
  }
};

export type HealthCheckOverallStatus = 'READY' | 'WARNING' | 'BLOCKED' | 'UNKNOWN';

export type NameMatchResult = 'MATCH' | 'MINOR_VARIATION' | 'POSSIBLE_MISMATCH' | 'MISMATCH' | 'UNKNOWN';
export type DobMatchResult = 'MATCH' | 'MISMATCH' | 'YEAR_MISMATCH_ONLY' | 'MISSING' | 'UNKNOWN';
export type AddressMatchResult = 'CONSISTENT' | 'POSSIBLE_VARIATION' | 'MISMATCH' | 'UNKNOWN';
export type ExpiryResult = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNKNOWN';
export type RequiredDocResult = 'PRESENT' | 'MISSING' | 'UNCLEAR';
export type AadhaarFormatResult = 'VALID' | 'INVALID' | 'UNCHECKED';
export type AadhaarSeedingResult = 'USER_REPORTED_OK' | 'USER_REPORTED_NOT_OK' | 'UNKNOWN';

export interface ExtractedFact {
  id: string;
  caseId?: string;
  key: string;
  label: string;
  value: string;
  provenance: ProvenanceType;
  sourceDoc?: string;
  confidence: ConfidenceLevel;
  notes?: string;
}

export interface PFMSTaxonomyEntry {
  id: string;
  stage: 'Validation, account' | 'Validation, Aadhaar' | 'Payment, account' | 'Payment, Aadhaar';
  reason: string;
  remedy: string;
  responsible: 'Citizen' | 'Department' | 'Bank' | 'Department (citizen supplies)';
  destination: 'Bank' | 'Department' | 'Bank + Department';
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  version: number;
}

export interface RuleTraceItem {
  id: string;
  ruleName: string;
  category: 'IDENTITY' | 'AGE' | 'RESIDENCE' | 'VALIDITY' | 'BANK_SEEDING' | 'COMPLIANCE';
  resultStatus: 'PASS' | 'WARNING' | 'FAIL' | 'UNKNOWN';
  resultCode: string;
  summary: string;
  detail: string;
  evidence: string;
  testedDocuments: string[];
  remedyRequired?: string;
}

export interface DiagnosisResult {
  caseId?: string;
  code: string;
  title: string;
  stage: string;
  remedy: string;
  responsible: string;
  destination: string;
  confidence: ConfidenceLevel;
  evidence: string;
  evidenceSource: string;
  taxonomySource: string;
  isUnknownReason: boolean;
  nextAction: string;
}

export interface ActionItem {
  id: string;
  caseId?: string;
  title: string;
  problem: string;
  whyItMatters: string;
  destination: 'BANK' | 'DEPARTMENT' | 'CSC' | 'CITIZEN_HOME';
  destinationLabel: string;
  responsibleParty: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFORMATIONAL';
  instructions: string[];
  whatToCarry: string[];
  exactStatementToStaff?: string;
  turnaroundTime?: string;
  expectedOutput: string;
  requiresLetter: boolean;
  letterType?: 'BANK_REQUEST' | 'DEPARTMENT_CORRECTION' | 'DEPARTMENT_REASON_REQUEST' | 'KYC_UPDATE' | 'ESCALATION';
}

export interface CaseDocument {
  id: string;
  docType: 'AADHAAR' | 'BANK_PASSBOOK' | 'DEATH_CERTIFICATE' | 'RATION_CARD' | 'APPLICATION_ACK' | 'SMS_SCREENSHOT' | 'PFMS_STATUS';
  name: string;
  number?: string;
  holderName?: string;
  dob?: string;
  address?: string;
  issueDate?: string;
  expiryDate?: string;
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  seedingReported?: 'OK' | 'NOT_OK' | 'UNKNOWN';
  rawText?: string;
  verified: boolean;
}

export interface CaseEvent {
  id: string;
  caseId?: string;
  timestamp: string;
  eventType: 
    | 'CASE_CREATED'
    | 'FACT_EXTRACTED'
    | 'DOCUMENT_UPLOADED'
    | 'DIAGNOSIS_PERFORMED'
    | 'HEALTH_CHECK_COMPLETED'
    | 'LETTER_GENERATED'
    | 'CITIZEN_ACTION_MARKED'
    | 'SIMULATED_DAY_3_REMINDER'
    | 'SIMULATED_DAY_7_CHECK'
    | 'STATUS_UPDATED'
    | 'RESOLVED'
    | 'DOCUMENTS_CHECKED'
    | 'MISMATCH_DETECTED';
  title: string;
  description: string;
  actor: 'CITIZEN' | 'SORTED_AI' | 'PFMS_ENGINE' | 'BANK' | 'DEPARTMENT';
}

export interface CitizenCase {
  id: string;
  caseRef: string; // e.g. CASE-004821
  createdDate: string;
  schemeName: string;
  citizenName: string;
  citizenAge: number;
  language: 'en' | 'ta';
  location: string;
  journey: 'PRE_SUBMISSION_HEALTH_CHECK' | 'POST_SUBMISSION_DBT_FAILURE';
  status: CaseStatus;
  readinessPercentage: number;
  documents: CaseDocument[];
  extractedFacts: ExtractedFact[];
  ruleTraces: RuleTraceItem[];
  diagnosis?: DiagnosisResult;
  actions: ActionItem[];
  events: CaseEvent[];
  chatHistory?: { role: 'user' | 'assistant', content: string }[];
}
