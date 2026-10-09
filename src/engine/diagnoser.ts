import { PFMS_TAXONOMY, OFFICIAL_PFMS_SOURCE } from '../data/pfmsTaxonomy';
import { ConfidenceLevel, DiagnosisResult, ProvenanceType } from '../types';

export interface DiagnosisInput {
  applicationApproved: boolean | 'UNKNOWN';
  paymentGenerated: boolean | 'UNKNOWN';
  paymentFailed: boolean | 'UNKNOWN';
  reportedReasonText?: string;
  hasDocumentProof: boolean; // e.g. screenshot or status slip uploaded
  sourceDocName?: string;
}

export function diagnoseDBTFailure(input: DiagnosisInput): DiagnosisResult {
  const {
    applicationApproved,
    paymentGenerated,
    paymentFailed,
    reportedReasonText = '',
    hasDocumentProof,
    sourceDocName
  } = input;

  const cleanText = reportedReasonText.toLowerCase();

  // 1. If application is not approved yet
  if (applicationApproved === false) {
    return {
      code: 'APP-PENDING',
      title: 'Application Verification Pending at Department',
      stage: 'Initial Scrutiny',
      remedy: 'Contact Block Development Office or Taluk Office to verify scrutiny timeline.',
      responsible: 'Department',
      destination: 'Department',
      confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
      evidence: 'Application has not achieved approval status.',
      evidenceSource: sourceDocName || 'Citizen Report',
      taxonomySource: 'State Department Standard Operating Procedure',
      isUnknownReason: false,
      nextAction: 'Visit Taluk or Block Office with acknowledgement receipt to check pending verification level.'
    };
  }

  // 2. If payment was never generated
  if (paymentGenerated === false && applicationApproved === true) {
    return {
      code: 'GEN-WAITING',
      title: 'Application Approved — Fund Disbursement Order (FTO) Pending',
      stage: 'Sanction Order Generation',
      remedy: 'Wait for next state/central disbursement cycle or check scheme sanction list.',
      responsible: 'Department',
      destination: 'Department',
      confidence: 'MEDIUM',
      evidence: 'Approved record without generated payment lot or FTO.',
      evidenceSource: sourceDocName || 'Citizen Report',
      taxonomySource: 'PFMS Sanction Flow Guidelines',
      isUnknownReason: false,
      nextAction: 'Verify whether the latest payment batch has been released for your block.'
    };
  }

  // 3. Match against PFMS Taxonomy if there are keywords or error codes
  if (cleanText.length > 0) {
    // Check direct code match e.g. "P-U1", "V-A2", etc.
    const directCode = PFMS_TAXONOMY.find(item => cleanText.includes(item.id.toLowerCase()));
    if (directCode) {
      return {
        code: directCode.id,
        title: directCode.reason,
        stage: directCode.stage,
        remedy: directCode.remedy,
        responsible: directCode.responsible,
        destination: directCode.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: `Explicit PFMS diagnostic code "${directCode.id}" identified in reported failure context.`,
        evidenceSource: sourceDocName || 'Citizen Typed Status',
        taxonomySource: `${directCode.sourceName} (v${directCode.version})`,
        isUnknownReason: false,
        nextAction: `Execute ${directCode.destination} corrective action: ${directCode.remedy}.`
      };
    }

    // Keyword heuristics matched to PFMS taxonomy
    if (cleanText.includes('de-seeded') || cleanText.includes('deseeded') || (cleanText.includes('aadhaar') && cleanText.includes('not seeded'))) {
      const entry = PFMS_TAXONOMY.find(t => t.id === 'P-U1') || PFMS_TAXONOMY.find(t => t.id === 'V-U2')!;
      return {
        code: entry.id,
        title: entry.reason,
        stage: entry.stage,
        remedy: entry.remedy,
        responsible: entry.responsible,
        destination: entry.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: 'Aadhaar de-seeding or absence from NPCI beneficiary mapper identified in failure message.',
        evidenceSource: sourceDocName || 'Citizen Statement',
        taxonomySource: `${entry.sourceName} (v${entry.version})`,
        isUnknownReason: false,
        nextAction: 'Visit Bank Branch to submit Aadhaar Seeding Consent Form with NPCI Mapper activation mandate.'
      };
    }

    if (cleanText.includes('disabled for dbt') || cleanText.includes('dbt disabled')) {
      const entry = PFMS_TAXONOMY.find(t => t.id === 'P-U3')!;
      return {
        code: entry.id,
        title: entry.reason,
        stage: entry.stage,
        remedy: entry.remedy,
        responsible: entry.responsible,
        destination: entry.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: 'UID disabled for DBT transactions at bank switch level.',
        evidenceSource: sourceDocName || 'Citizen Statement',
        taxonomySource: `${entry.sourceName} (v${entry.version})`,
        isUnknownReason: false,
        nextAction: 'Contact bank branch manager to submit DBT activation request and NPCI mandate.'
      };
    }

    if (cleanText.includes('account closed') || cleanText.includes('closed account')) {
      const entry = PFMS_TAXONOMY.find(t => t.id === 'P-A7')!;
      return {
        code: entry.id,
        title: entry.reason,
        stage: entry.stage,
        remedy: entry.remedy,
        responsible: entry.responsible,
        destination: entry.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: 'Account marked closed by paying bank.',
        evidenceSource: sourceDocName || 'Citizen Statement',
        taxonomySource: `${entry.sourceName} (v${entry.version})`,
        isUnknownReason: false,
        nextAction: 'Provide active alternate bank account passbook copy to department.'
      };
    }

    if (cleanText.includes('kyc') || cleanText.includes('validation pending 6 months') || cleanText.includes('inactive account')) {
      const entry = PFMS_TAXONOMY.find(t => t.id === 'V-A6')!;
      return {
        code: entry.id,
        title: entry.reason,
        stage: entry.stage,
        remedy: entry.remedy,
        responsible: entry.responsible,
        destination: entry.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: 'Account KYC lapse or dormant validation pending.',
        evidenceSource: sourceDocName || 'Citizen Statement',
        taxonomySource: `${entry.sourceName} (v${entry.version})`,
        isUnknownReason: false,
        nextAction: 'Complete physical re-KYC at bank branch with Aadhaar and PAN / Form 60.'
      };
    }

    if (cleanText.includes('invalid ifsc') || cleanText.includes('ifsc')) {
      const entry = PFMS_TAXONOMY.find(t => t.id === 'V-A2')!;
      return {
        code: entry.id,
        title: entry.reason,
        stage: entry.stage,
        remedy: entry.remedy,
        responsible: entry.responsible,
        destination: entry.destination,
        confidence: hasDocumentProof ? 'HIGH' : 'MEDIUM',
        evidence: 'Bank merger or defunct branch IFSC provided in application.',
        evidenceSource: sourceDocName || 'Citizen Statement',
        taxonomySource: `${entry.sourceName} (v${entry.version})`,
        isUnknownReason: false,
        nextAction: 'Submit updated bank passbook front page with post-merger IFSC to scheme office.'
      };
    }
  }

  // 4. UNKNOWN paths based on missing evidence
  if (applicationApproved === 'UNKNOWN') {
    return {
      code: 'UNKNOWN_APPROVAL',
      title: "I don't have enough verified information to determine if your application was approved.",
      stage: 'Unknown Stage',
      remedy: 'Verify your application approval status on the scheme portal or at the scheme office.',
      responsible: 'Citizen',
      destination: 'Department',
      confidence: 'LOW',
      evidence: 'Missing application approval status.',
      evidenceSource: 'Absence of information',
      taxonomySource: 'System Heuristics',
      isUnknownReason: true,
      nextAction: 'Check scheme portal to confirm if application is approved.'
    };
  }

  return {
    code: 'UNKNOWN_REJECTION',
    title: "I don't have enough verified information to determine the exact failure reason.",
    stage: 'Unknown Stage',
    remedy: 'Obtain the specific PFMS/NPCI payment rejection code from the relevant official/bank channel.',
    responsible: 'Citizen',
    destination: 'Department',
    confidence: 'LOW',
    evidence: 'Payment failed or stalled without specific PFMS/NPCI return code communicated to citizen.',
    evidenceSource: 'Absence of official error string',
    taxonomySource: 'System Heuristics',
    isUnknownReason: true,
    nextAction: 'Obtain the exact payment failure reason or code from the relevant official/bank channel.'
  };
}
