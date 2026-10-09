import { 
  CaseDocument, 
  HealthCheckOverallStatus, 
  RuleTraceItem 
} from '../types';
import { validateVerhoeffAadhaar } from './verhoeff';
import { detectMismatches } from './mismatchEngine';

// Standard Indian honorifics and initials normalization
const HONORIFICS = ['shri', 'smt', 'srimathi', 'thiru', 'selvi', 'dr', 'mr', 'mrs', 'ms', 'kumari', 'late'];

function normalizeName(name: string): { tokens: string[]; clean: string } {
  let clean = name.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  let tokens = clean.split(' ').filter(t => t.length > 0);
  tokens = tokens.filter(t => !HONORIFICS.includes(t));
  return { tokens, clean: tokens.sort().join(' ') };
}

function calculateNameSimilarity(name1: string, name2: string): {
  score: number;
  result: 'MATCH' | 'MINOR_VARIATION' | 'POSSIBLE_MISMATCH' | 'MISMATCH';
  notes: string;
} {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  if (norm1.clean === norm2.clean) {
    return { score: 1.0, result: 'MATCH', notes: 'Exact token match after honorific normalization.' };
  }

  // Check initial expansion e.g., "k lakshmi" vs "lakshmi" or "k. lakshmi" vs "krishnan lakshmi"
  const tokens1 = norm1.tokens;
  const tokens2 = norm2.tokens;

  const sharedTokens = tokens1.filter(t => tokens2.includes(t));
  const maxTokens = Math.max(tokens1.length, tokens2.length);

  // Check if initials match
  let initialsMatch = false;
  if (tokens1.length > 0 && tokens2.length > 0) {
    const singleLetter1 = tokens1.filter(t => t.length === 1);
    const words2 = tokens2.filter(t => t.length > 1);
    for (const init of singleLetter1) {
      if (words2.some(w => w.startsWith(init))) {
        initialsMatch = true;
      }
    }
  }

  if (sharedTokens.length === maxTokens) {
    return { score: 0.98, result: 'MATCH', notes: 'Word order variation only.' };
  }

  if (sharedTokens.length >= 1 && (initialsMatch || sharedTokens.length >= maxTokens - 1)) {
    return { 
      score: 0.85, 
      result: 'MINOR_VARIATION', 
      notes: 'Initial or minor patronymic variation detected. May be accepted by some banks, but official affidavit or bank certificate recommended.' 
    };
  }

  if (sharedTokens.length >= 1) {
    return { 
      score: 0.60, 
      result: 'POSSIBLE_MISMATCH', 
      notes: 'Only partial name tokens match. High risk of PFMS / DBT rejection.' 
    };
  }

  return { 
    score: 0.20, 
    result: 'MISMATCH', 
    notes: `Completely distinct names: "${name1}" vs "${name2}". Application will be blocked.` 
  };
}

function normalizeDate(dateStr?: string): { year?: number; month?: number; day?: number; raw: string } {
  if (!dateStr) return { raw: '' };
  const clean = dateStr.trim();
  
  // Try YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]), day: parseInt(isoMatch[3]), raw: clean };
  }
  
  // Try DD-MM-YYYY
  const indMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (indMatch) {
    return { day: parseInt(indMatch[1]), month: parseInt(indMatch[2]), year: parseInt(indMatch[3]), raw: clean };
  }

  // Try Year only
  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    return { year: parseInt(yearMatch[1]), raw: clean };
  }

  return { raw: clean };
}

export function runHealthCheck(
  schemeName: string,
  documents: CaseDocument[],
  todayStr: string = '2026-10-08'
): {
  overallStatus: HealthCheckOverallStatus;
  readinessPercentage: number;
  ruleTraces: RuleTraceItem[];
} {
  const traces: RuleTraceItem[] = [];
  const today = new Date(todayStr);

  const aadhaarDoc = documents.find(d => d.docType === 'AADHAAR');
  const bankDoc = documents.find(d => d.docType === 'BANK_PASSBOOK');
  const otherDocs = documents.filter(d => d.docType !== 'AADHAAR' && d.docType !== 'BANK_PASSBOOK');

  // 1. AADHAAR_FORMAT (UIDAI Verhoeff Checksum)
  if (aadhaarDoc && aadhaarDoc.number) {
    const vCheck = validateVerhoeffAadhaar(aadhaarDoc.number);
    if (vCheck.isValid) {
      traces.push({
        id: 'RULE-AADHAAR-FORMAT',
        ruleName: 'AADHAAR_FORMAT',
        category: 'IDENTITY',
        resultStatus: 'PASS',
        resultCode: 'VERHOEFF_VALID',
        summary: 'Aadhaar 12-digit format & UIDAI Verhoeff algorithm verified.',
        detail: `The 12-digit number ${aadhaarDoc.number.replace(/\d(?=\d{4})/g, 'X')} passes the UIDAI polynomial checksum.`,
        evidence: `Computed checksum value = 0. Length: 12 digits.`,
        testedDocuments: ['AADHAAR']
      });
    } else {
      traces.push({
        id: 'RULE-AADHAAR-FORMAT',
        ruleName: 'AADHAAR_FORMAT',
        category: 'IDENTITY',
        resultStatus: 'FAIL',
        resultCode: 'VERHOEFF_INVALID',
        summary: 'Aadhaar fails UIDAI algorithm or character length check.',
        detail: vCheck.reason || 'Checksum mismatch.',
        evidence: `Input: ${aadhaarDoc.number}. Reason: ${vCheck.reason}`,
        testedDocuments: ['AADHAAR'],
        remedyRequired: 'Re-verify Aadhaar card number. A typo will cause immediate PFMS V-U1 rejection.'
      });
    }
  } else {
    traces.push({
      id: 'RULE-AADHAAR-FORMAT',
      ruleName: 'AADHAAR_FORMAT',
      category: 'IDENTITY',
      resultStatus: 'UNKNOWN',
      resultCode: 'DOCUMENT_MISSING',
      summary: 'Aadhaar document not provided for format check.',
      detail: 'Aadhaar is mandatory for DBT transfers across central & state schemes.',
      evidence: 'No AADHAAR document found.',
      testedDocuments: [],
      remedyRequired: 'Upload or provide your 12-digit Aadhaar number.'
    });
  }

  // 2 & 3. Cross-document mismatch detection (Name, DOB, Address) using Mismatch Engine
  const mismatches = detectMismatches(documents);
  
  for (const m of mismatches) {
    if (m.field === 'name') {
      traces.push({
        id: `RULE-NAME-MATCH-${Date.now()}-${Math.random()}`,
        ruleName: 'NAME_MATCH',
        category: 'IDENTITY',
        resultStatus: m.status === 'ACTION_REQUIRED' ? 'FAIL' : 'WARNING',
        resultCode: m.status === 'ACTION_REQUIRED' ? 'NAME_MISMATCH_BLOCKING' : 'NAME_MINOR_VARIATION',
        summary: `Name Mismatch between ${m.documentA.type} and ${m.documentB.type}`,
        detail: `${m.documentA.type}: "${m.documentA.value}" vs ${m.documentB.type}: "${m.documentB.value}".`,
        evidence: m.evidence.join(' | '),
        testedDocuments: [m.documentA.type, m.documentB.type],
        remedyRequired: m.recommendedAction
      });
    } else if (m.field === 'dob') {
      traces.push({
        id: `RULE-DOB-MATCH-${Date.now()}-${Math.random()}`,
        ruleName: 'DOB_MATCH',
        category: 'AGE',
        resultStatus: m.status === 'ACTION_REQUIRED' ? 'FAIL' : 'WARNING',
        resultCode: m.status === 'ACTION_REQUIRED' ? 'DOB_YEAR_MISMATCH_CRITICAL' : 'DOB_MINOR_MISMATCH',
        summary: `Critical Date of Birth / Year Mismatch detected.`,
        detail: `${m.documentA.type} states ${m.documentA.value}, but ${m.documentB.type} states ${m.documentB.value}.`,
        evidence: m.evidence.join(' | '),
        testedDocuments: [m.documentA.type, m.documentB.type],
        remedyRequired: m.recommendedAction
      });
    } else if (m.field === 'address') {
      traces.push({
        id: `RULE-ADDRESS-MATCH-${Date.now()}-${Math.random()}`,
        ruleName: 'ADDRESS_MATCH',
        category: 'RESIDENCE',
        resultStatus: m.status === 'ACTION_REQUIRED' ? 'FAIL' : 'WARNING',
        resultCode: 'ADDRESS_MISMATCH',
        summary: `Address mismatch detected.`,
        detail: `${m.documentA.type}: "${m.documentA.value}" vs ${m.documentB.type}: "${m.documentB.value}".`,
        evidence: m.evidence.join(' | '),
        testedDocuments: [m.documentA.type, m.documentB.type],
        remedyRequired: m.recommendedAction
      });
    }
  }

  // Ensure passing traces for NAME_MATCH and DOB_MATCH if no mismatches found
  const nameMismatches = mismatches.filter(m => m.field === 'name');
  if (nameMismatches.length === 0 && aadhaarDoc && bankDoc) {
      traces.push({
        id: 'RULE-NAME-MATCH-BANK',
        ruleName: 'NAME_MATCH',
        category: 'IDENTITY',
        resultStatus: 'PASS',
        resultCode: 'NAME_MATCH_EXACT',
        summary: 'Aadhaar and Bank Passbook names match consistently.',
        detail: `Aadhaar: "${aadhaarDoc.holderName}" matches Passbook: "${bankDoc.holderName}".`,
        evidence: 'Exact token match after honorific normalization.',
        testedDocuments: ['AADHAAR', 'BANK_PASSBOOK']
      });
  }

  const dobMismatches = mismatches.filter(m => m.field === 'dob');
  const docsWithDob = documents.filter(d => d.dob);
  if (dobMismatches.length === 0 && docsWithDob.length >= 2) {
      traces.push({
        id: 'RULE-DOB-MATCH',
        ruleName: 'DOB_MATCH',
        category: 'AGE',
        resultStatus: 'PASS',
        resultCode: 'DOB_EXACT_MATCH',
        summary: 'Date of Birth matches identically across submitted documents.',
        detail: `Checked ${docsWithDob.length} documents for date of birth.`,
        evidence: `No significant mismatches found.`,
        testedDocuments: docsWithDob.map(d => d.docType)
      });
  }

  // 4. AADHAAR_BANK_SEEDING (NPCI Mapper Status)
  const seedingState = bankDoc?.seedingReported || 'UNKNOWN';
  if (seedingState === 'OK') {
    traces.push({
      id: 'RULE-AADHAAR-SEEDING',
      ruleName: 'AADHAAR_BANK_SEEDING',
      category: 'BANK_SEEDING',
      resultStatus: 'PASS',
      resultCode: 'USER_REPORTED_OK',
      summary: 'Aadhaar is linked and active on NPCI DBT mapper.',
      detail: 'Citizen reported successful verification via bank or official UIDAI portal.',
      evidence: 'Citizen status confirmation.',
      testedDocuments: ['BANK_PASSBOOK']
    });
  } else if (seedingState === 'NOT_OK') {
    traces.push({
      id: 'RULE-AADHAAR-SEEDING',
      ruleName: 'AADHAAR_BANK_SEEDING',
      category: 'BANK_SEEDING',
      resultStatus: 'FAIL',
      resultCode: 'USER_REPORTED_NOT_OK',
      summary: 'Aadhaar is NOT seeded with Bank on NPCI Mapper.',
      detail: 'Aadhaar seeding is required for DBT credits. Without it, payments are returned with PFMS error P-U1.',
      evidence: 'Account unlinked or de-seeded in NPCI database.',
      testedDocuments: ['BANK_PASSBOOK'],
      remedyRequired: 'Submit the Aadhaar Seeding & NPCI Mandate form to your home branch immediately.'
    });
  } else {
    traces.push({
      id: 'RULE-AADHAAR-SEEDING',
      ruleName: 'AADHAAR_BANK_SEEDING',
      category: 'BANK_SEEDING',
      resultStatus: 'WARNING',
      resultCode: 'SEEDING_STATUS_UNKNOWN',
      summary: 'Aadhaar Bank Seeding Status Unconfirmed.',
      detail: 'Over 50% of DBT failures in Annapurna & PM-KISAN occur because account is linked for KYC but not mapped in NPCI.',
      evidence: 'Not verified through official bank or UIDAI portal.',
      testedDocuments: ['BANK_PASSBOOK'],
      remedyRequired: 'Check Aadhaar seeding status via bank SMS or branch inquiry.'
    });
  }

  // 5. REQUIRED_DOCUMENT completeness check for the scheme
  const hasAadhaar = Boolean(aadhaarDoc);
  const hasBank = Boolean(bankDoc);
  if (!hasAadhaar || !hasBank) {
    traces.push({
      id: 'RULE-REQUIRED-DOCS',
      ruleName: 'REQUIRED_DOCUMENT',
      category: 'COMPLIANCE',
      resultStatus: 'FAIL',
      resultCode: 'MANDATORY_DOC_MISSING',
      summary: 'Core documents missing for scheme submission.',
      detail: `Missing: ${[!hasAadhaar ? 'Aadhaar' : '', !hasBank ? 'Bank Passbook' : ''].filter(Boolean).join(', ')}.`,
      evidence: `Scheme: ${schemeName}. Documents provided: ${documents.map(d => d.name).join(', ') || 'None'}.`,
      testedDocuments: documents.map(d => d.docType),
      remedyRequired: 'Both Aadhaar Card and active Bank Passbook are mandatory.'
    });
  } else {
    traces.push({
      id: 'RULE-REQUIRED-DOCS',
      ruleName: 'REQUIRED_DOCUMENT',
      category: 'COMPLIANCE',
      resultStatus: 'PASS',
      resultCode: 'MANDATORY_DOCS_PRESENT',
      summary: 'All core statutory documents provided.',
      detail: `Verified presence of Aadhaar and Bank Passbook for ${schemeName}.`,
      evidence: `Verified ${documents.length} document(s).`,
      testedDocuments: documents.map(d => d.docType)
    });
  }

  // Determine Overall Status & Readiness Score
  const hasFails = traces.some(t => t.resultStatus === 'FAIL');
  const hasWarnings = traces.some(t => t.resultStatus === 'WARNING');
  const hasUnknowns = traces.some(t => t.resultStatus === 'UNKNOWN');

  let overallStatus: HealthCheckOverallStatus = 'READY';
  let readinessPercentage = 100;

  if (hasFails) {
    overallStatus = 'BLOCKED';
    const passCount = traces.filter(t => t.resultStatus === 'PASS').length;
    readinessPercentage = Math.round((passCount / Math.max(traces.length, 1)) * 100);
  } else if (hasWarnings) {
    overallStatus = 'WARNING';
    const passCount = traces.filter(t => t.resultStatus === 'PASS').length;
    readinessPercentage = Math.min(85, Math.round((passCount / Math.max(traces.length, 1)) * 100));
  } else if (hasUnknowns) {
    overallStatus = 'UNKNOWN';
    readinessPercentage = 50;
  }

  return {
    overallStatus,
    readinessPercentage,
    ruleTraces: traces
  };
}
