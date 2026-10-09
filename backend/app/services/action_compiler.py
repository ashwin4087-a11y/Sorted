from app.models import Diagnosis, Mismatch

def compile_actions(diagnosis: Diagnosis | None, mismatches: list[Mismatch] | None) -> list[dict]:
    actions = []
    
    # 1. Compile from Diagnosis
    if diagnosis:
        if "Bank" in (diagnosis.escalation or ""):
            is_seeding = diagnosis.failure_code in ["P-U1", "P-U2", "P-U3", "P-U4", "V-U1", "V-U2", "V-U3", "V-U4", "V-U5", "V-U6", "AADHAAR_NOT_SEEDED"]
            actions.append({
                "id": "ACT-BANK-01",
                "title": 'Submit Aadhaar Seeding & NPCI DBT Mandate at Bank' if is_seeding else 'Complete Bank KYC & Account Verification',
                "problem": diagnosis.root_cause,
                "why_it_matters": diagnosis.remedy,
                "destination": 'BANK',
                "destination_label": 'Home Bank Branch (Customer Service Desk)',
                "responsible_party": 'Citizen',
                "severity": 'BLOCKING',
                "instructions": [
                    'Visit your home branch between 10:00 AM and 2:00 PM.',
                    'Request the official "Aadhaar Seeding & NPCI DBT Enablement Form" (Annexure I).' if is_seeding else 'Request full KYC update form.',
                    'Tick the consent checkbox specifically authorizing DBT benefit credits via NPCI mapper.' if is_seeding else 'Fill all required details.',
                    'Mandatory: Do NOT leave without a stamped acknowledgement slip from the bank official.'
                ],
                "what_to_carry": [
                    'Original Aadhaar Card + 2 self-attested photocopies',
                    'Original Bank Passbook',
                    'Government Scheme Registration / Acknowledgement Slip',
                    'Two passport-sized photographs'
                ],
                "expected_output": 'Stamped Bank Acknowledgement Slip with CBS Reference Number confirming NPCI mapper update.',
                "exact_statement_to_staff": f'"Sir/Madam, I am an approved beneficiary under my scheme. My PFMS payments are failing under code {diagnosis.failure_code} because my Aadhaar is not active on the NPCI mapper. Please link my Aadhaar in CBS and tick the mandate for NPCI DBT credit."' if is_seeding else '"Sir/Madam, please complete my full KYC and ensure there are no holds on my account so I can receive DBT payments."',
                "turnaround_time": '48 to 72 hours for CBS update, 5-7 days for NPCI mapper sync.',
                "requires_letter": True,
                "letter_type": 'BANK_REQUEST'
            })
            
        if "Department" in (diagnosis.escalation or ""):
            is_unknown = diagnosis.failure_code in ["UNKNOWN_PAYMENT_FAILURE", "NEEDS_MANUAL_REVIEW"]
            
            act_title = 'Submit Rectified Records to Block / Scheme Department Office'
            act_statement = '"My bank has updated the NPCI mapper. Kindly inspect my beneficiary record in the scheme portal and confirm my status is cleared for the upcoming Fund Transfer Order (FTO)."'
            act_expected = 'Online portal status updated to "Ready for FTO".'
            
            if is_unknown:
                act_title = 'Request Exact PFMS Payment Rejection Code'
                act_statement = '"Kindly check the PFMS portal for my beneficiary record and provide the exact failure code blocking my payment."'
                act_expected = 'Written PFMS failure code and sub-reason slip.'
                
            actions.append({
                "id": 'ACT-DEPT-01',
                "title": act_title,
                "problem": diagnosis.root_cause,
                "why_it_matters": diagnosis.remedy,
                "destination": 'DEPARTMENT',
                "destination_label": 'Block Development Office (BDO) / Taluk Supply Officer',
                "responsible_party": 'Citizen',
                "severity": 'BLOCKING',
                "instructions": [
                    'Visit the Block Development Office or Taluk Office Scheme Helpdesk.',
                    'Present the generated letter requesting the exact PFMS payment rejection sub-code.' if is_unknown else 'Submit the updated bank passbook and identity documents to update the beneficiary portal.',
                    'Request the nodal clerk to pull up your record on the scheme portal and verify the status.'
                ],
                "what_to_carry": [
                    'Generated Official Request Letter' if is_unknown else 'Application Acknowledgement with registration number',
                    'Original Aadhaar Card',
                    'Bank passbook showing recent transactions'
                ],
                "expected_output": act_expected,
                "exact_statement_to_staff": act_statement,
                "turnaround_time": 'Immediate over the counter, or Next scheduled state disbursement cycle.',
                "requires_letter": True,
                "letter_type": 'DEPARTMENT_REASON_REQUEST' if is_unknown else 'DEPARTMENT_CORRECTION'
            })

    # 2. Compile from Mismatches
    if mismatches:
        for mismatch in mismatches:
            if mismatch.severity in ["HIGH", "MAJOR_MISMATCH"]:
                if mismatch.field_name == "date_of_birth":
                    actions.append({
                        "id": 'ACT-CORRECT-DOB',
                        "title": 'Obtain Age / Date of Birth Clerical Correction Certificate',
                        "problem": 'Date of Birth mismatch detected across submitted documents.',
                        "why_it_matters": 'Date of birth discrepancies frequently cause clerical rejections during application processing.',
                        "destination": 'DEPARTMENT',
                        "destination_label": 'Municipal Corporation / Gram Panchayat Office',
                        "responsible_party": 'Citizen',
                        "severity": 'BLOCKING',
                        "instructions": [
                            'Visit the issuing municipal / panchayat authority with primary family records.',
                            'Request a certified clerical correction memo reconciling the birth year.',
                            'Keep both documents along with the rectification memo before submitting the scheme application.'
                        ],
                        "what_to_carry": [
                            'Primary Family ID / Ration Card',
                            'Certificate with divergent date',
                            'Affidavit on stamp paper or Panchayat Secretary recommendation letter'
                        ],
                        "expected_output": 'Official endorsement memo reconciling birth year.',
                        "exact_statement_to_staff": '"My Aadhaar shows my birth year as X, but my family record shows Y. I need an official clerical correction or affidavit to reconcile this mismatch before I can file my application without rejection."',
                        "turnaround_time": 'Same day if affidavit, up to 15 days if municipal correction.',
                        "requires_letter": False
                    })
                elif mismatch.field_name in ["holder_name", "name"]:
                    actions.append({
                        "id": 'ACT-NAME-RECTIFY',
                        "title": 'Resolve name mismatch',
                        "problem": 'Name mismatch between submitted records.',
                        "why_it_matters": 'These records contain different names. The relevant authority/bank should confirm which record needs correction.',
                        "destination": 'BANK',
                        "destination_label": 'Relevant Bank or Authority',
                        "responsible_party": 'Citizen',
                        "severity": 'BLOCKING',
                        "instructions": [
                            'Confirm the correct name',
                            'Contact the relevant bank/authority',
                            'Carry the supporting identity document',
                            'Submit the correction request',
                            'Keep the acknowledgement',
                            'Re-check the application before submission'
                        ],
                        "what_to_carry": [
                            'Supporting identity document',
                            'Bank record',
                            'Generated correction request'
                        ],
                        "expected_output": 'Reprinted Passbook front page or official acknowledgement of name correction.',
                        "exact_statement_to_staff": '"Please update my name in your records to match my primary identity document to prevent scheme rejections."',
                        "turnaround_time": 'Depends on the authority.',
                        "requires_letter": True,
                        "letter_type": 'BANK_REQUEST'
                    })
                elif mismatch.field_name == "document":
                    actions.append({
                        "id": 'ACT-UPLOAD-DOC',
                        "title": 'Upload Missing Document',
                        "problem": 'Required document missing from application.',
                        "why_it_matters": 'Application will be immediately rejected without this document.',
                        "destination": 'CITIZEN_HOME',
                        "destination_label": 'Online Portal',
                        "responsible_party": 'Citizen',
                        "severity": 'BLOCKING',
                        "instructions": [
                            'Procure the missing document.',
                            'Upload it to the application portal.'
                        ],
                        "what_to_carry": [],
                        "expected_output": 'Document successfully uploaded.',
                        "requires_letter": False
                    })

    return actions
