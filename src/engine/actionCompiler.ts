import { ActionItem, DiagnosisResult, RuleTraceItem } from '../types';

export function compileActions(
  diagnosis?: DiagnosisResult,
  ruleTraces: RuleTraceItem[] = []
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Compile from DBT failure diagnosis
  if (diagnosis) {
    if (diagnosis.destination.includes('Bank')) {
      const isSeeding = diagnosis.code.includes('U1') || diagnosis.code.includes('U2') || diagnosis.code.includes('U3') || diagnosis.code.includes('U4') || diagnosis.code.includes('U5');
      actions.push({
        id: 'ACT-BANK-01',
        title: isSeeding ? 'Submit Aadhaar Seeding & NPCI DBT Mandate at Bank' : 'Complete Bank KYC & Account Verification',
        problem: diagnosis.title,
        whyItMatters: diagnosis.remedy,
        destination: 'BANK',
        destinationLabel: 'Home Bank Branch (Customer Service Desk)',
        responsibleParty: 'Citizen',
        severity: 'BLOCKING',
        instructions: [
          'Visit your home branch between 10:00 AM and 2:00 PM.',
          'Request the official "Aadhaar Seeding & NPCI DBT Enablement Form" (Annexure I).',
          'Tick the consent checkbox specifically authorizing DBT benefit credits via NPCI mapper.',
          'Mandatory: Do NOT leave without a stamped acknowledgement slip from the bank official.'
        ],
        whatToCarry: [
          'Original Aadhaar Card + 2 self-attested photocopies',
          'Original Bank Passbook',
          'Government Scheme Registration / Acknowledgement Slip',
          'Two passport-sized photographs'
        ],
        expectedOutput: 'Stamped Bank Acknowledgement Slip with CBS Reference Number confirming NPCI mapper update.',
        exactStatementToStaff: isSeeding ? '"Sir/Madam, I am an approved beneficiary under my scheme. My PFMS payments are failing under code ' + (diagnosis.code) + ' because my Aadhaar is not active on the NPCI mapper. Please link my Aadhaar in CBS and tick the mandate for NPCI DBT credit."' : '"Sir/Madam, please complete my full KYC and ensure there are no holds on my account so I can receive DBT payments."',
        turnaroundTime: '48 to 72 hours for CBS update, 5-7 days for NPCI mapper sync.',
        requiresLetter: true,
        letterType: 'BANK_REQUEST'
      });
    }

    if (diagnosis.destination.includes('Department')) {
      const isUnknownApproval = diagnosis.code === 'UNKNOWN_APPROVAL';
      const isUnknownRejection = diagnosis.code === 'UNKNOWN_REJECTION';
      const isUnknown = diagnosis.isUnknownReason;

      let actTitle = 'Submit Rectified Records to Block / Scheme Department Office';
      let actStatement = '"My bank has updated the NPCI mapper. Kindly inspect my beneficiary record in the scheme portal and confirm my status is cleared for the upcoming Fund Transfer Order (FTO)."';
      let actExpected = 'Online portal status updated to "Ready for FTO".';

      if (isUnknownApproval) {
        actTitle = 'Verify Application Approval Status with Scheme Nodal Officer';
        actStatement = '"Sir/Madam, I applied for the scheme but I have not received any updates. Can you check my application status on your portal?"';
        actExpected = 'A verbal confirmation or printout of your current application stage and approval status.';
      } else if (isUnknownRejection) {
        actTitle = 'Request Exact PFMS Payment Rejection Code';
        actStatement = '"Kindly check the PFMS portal for my beneficiary record and provide the exact failure code blocking my payment."';
        actExpected = 'Written PFMS failure code and sub-reason slip.';
      }

      actions.push({
        id: 'ACT-DEPT-01',
        title: actTitle,
        problem: isUnknown ? diagnosis.title : diagnosis.title,
        whyItMatters: isUnknown ? diagnosis.remedy : diagnosis.remedy,
        destination: 'DEPARTMENT',
        destinationLabel: 'Block Development Office (BDO) / Taluk Supply Officer',
        responsibleParty: 'Citizen',
        severity: 'BLOCKING',
        instructions: [
          'Visit the Block Development Office or Taluk Office Scheme Helpdesk.',
          isUnknownApproval ? 'Provide your Aadhaar and Application ID to the clerk.' : (isUnknownRejection ? 'Present the generated letter requesting the exact PFMS payment rejection sub-code.' : 'Submit the updated bank passbook and identity documents to update the beneficiary portal.'),
          'Request the nodal clerk to pull up your record on the scheme portal and verify the status.'
        ],
        whatToCarry: [
          isUnknownRejection ? 'Generated Official Request Letter' : 'Application Acknowledgement with registration number',
          'Original Aadhaar Card',
          'Bank passbook showing recent transactions'
        ],
        expectedOutput: actExpected,
        exactStatementToStaff: actStatement,
        turnaroundTime: 'Immediate over the counter, or Next scheduled state disbursement cycle.',
        requiresLetter: isUnknownRejection || !isUnknown,
        letterType: isUnknown ? 'DEPARTMENT_REASON_REQUEST' : 'DEPARTMENT_CORRECTION'
      });
    }
  }

  // Compile from Health Check rule traces
  for (const trace of ruleTraces) {
    if (trace.resultStatus === 'FAIL') {
      if (trace.ruleName === 'DOB_MATCH') {
        actions.push({
          id: 'ACT-CORRECT-DOB',
          title: 'Obtain Age / Date of Birth Clerical Correction Certificate',
          problem: 'Date of Birth mismatch detected across submitted documents.',
          whyItMatters: 'Date of birth discrepancies frequently cause clerical rejections during application processing.',
          destination: 'DEPARTMENT',
          destinationLabel: 'Municipal Corporation / Gram Panchayat Office',
          responsibleParty: 'Citizen',
          severity: 'BLOCKING',
          instructions: [
            'Visit the issuing municipal / panchayat authority with primary family records.',
            'Request a certified clerical correction memo reconciling the birth year.',
            'Keep both documents along with the rectification memo before submitting the scheme application.'
          ],
          whatToCarry: [
            'Primary Family ID / Ration Card',
            'Certificate with divergent date',
            'Affidavit on stamp paper or Panchayat Secretary recommendation letter'
          ],
          expectedOutput: 'Official endorsement memo reconciling birth year.',
          exactStatementToStaff: '"My Aadhaar shows my birth year as X, but my family record shows Y. I need an official clerical correction or affidavit to reconcile this mismatch before I can file my application without rejection."',
          turnaroundTime: 'Same day if affidavit, up to 15 days if municipal correction.',
          requiresLetter: false
        });
      }

      if (trace.ruleName === 'NAME_MATCH') {
        actions.push({
          id: 'ACT-NAME-RECTIFY',
          title: 'Resolve name mismatch',
          problem: 'Name mismatch between submitted records.',
          whyItMatters: 'These records contain different names. The relevant authority/bank should confirm which record needs correction.',
          destination: 'BANK',
          destinationLabel: 'Relevant Bank or Authority',
          responsibleParty: 'Citizen',
          severity: 'BLOCKING',
          instructions: [
            'Confirm the correct name',
            'Contact the relevant bank/authority',
            'Carry the supporting identity document',
            'Submit the correction request',
            'Keep the acknowledgement',
            'Re-check the application before submission'
          ],
          whatToCarry: [
            'Supporting identity document',
            'Bank record',
            'Generated correction request'
          ],
          expectedOutput: 'Reprinted Passbook front page or official acknowledgement of name correction.',
          exactStatementToStaff: '"Please update my name in your records to match my primary identity document to prevent scheme rejections."',
          turnaroundTime: 'Depends on the authority.',
          requiresLetter: true,
          letterType: 'BANK_REQUEST'
        });
      }
    }
  }

  return actions;
}
