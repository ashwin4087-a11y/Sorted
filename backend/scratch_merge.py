import json

pfms_entries = [
  {"id": "V-A1", "stage": "Validation, account", "reason": "Account number invalid (rejected by bank)", "remedy": "Provide valid bank account to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A2", "stage": "Validation, account", "reason": "Invalid IFSC", "remedy": "Provide valid IFSC to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A3", "stage": "Validation, account", "reason": "Account does not exist", "remedy": "Provide valid bank account to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A4", "stage": "Validation, account", "reason": "Account closed", "remedy": "Provide active valid bank account to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A5", "stage": "Validation, account", "reason": "Blocked account", "remedy": "Provide valid bank account or clear block at bank branch", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A6", "stage": "Validation, account", "reason": "Invalid account, validation pending 6 months", "remedy": "Contact bank branch for KYC update and document verification", "responsible": "Citizen", "destination": "Bank"},
  {"id": "V-A7", "stage": "Validation, account", "reason": "Bank name and IFSC not related", "remedy": "Provide valid bank branch details to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A8", "stage": "Validation, account", "reason": "UID and account both invalid", "remedy": "Provide valid bank account to scheme department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A9", "stage": "Validation, account", "reason": "Bank inactive / merged", "remedy": "Provide valid (current merged bank) account & new IFSC", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-A10", "stage": "Validation, account", "reason": "UID disabled for DBT and account closed", "remedy": "(1) Bank: Aadhaar seeding + NPCI mapper update; (2) provide valid bank account to department", "responsible": "Citizen", "destination": "Bank + Department"},
  {"id": "V-U1", "stage": "Validation, Aadhaar", "reason": "Aadhaar not 12 digits / fails UIDAI algorithm", "remedy": "Department obtains correct Aadhaar from beneficiary with UIDAI checksum check", "responsible": "Department (citizen supplies)", "destination": "Department"},
  {"id": "V-U2", "stage": "Validation, Aadhaar", "reason": "Aadhaar not seeded in NPCI", "remedy": "Bank: Aadhaar seeding + NPCI mapper update with consent mandate", "responsible": "Citizen", "destination": "Bank"},
  {"id": "V-U3", "stage": "Validation, Aadhaar", "reason": "UID and account both invalid", "remedy": "Provide valid bank account to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "V-U4", "stage": "Validation, Aadhaar", "reason": "UID disabled for DBT", "remedy": "Bank: seeding + NPCI mapper update to enable DBT credit", "responsible": "Citizen", "destination": "Bank"},
  {"id": "V-U5", "stage": "Validation, Aadhaar", "reason": "UID never enabled for DBT", "remedy": "Bank: submit Aadhaar seeding consent form + NPCI mapper registration", "responsible": "Citizen", "destination": "Bank"},
  {"id": "V-U6", "stage": "Validation, Aadhaar", "reason": "UID cancelled by UIDAI", "remedy": "Provide valid Aadhaar details / update biometric & demographic records at Aadhaar Seva Kendra", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-A1", "stage": "Payment, account", "reason": "Account marked invalid in PFMS", "remedy": "Provide valid bank account to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-A2", "stage": "Payment, account", "reason": "Both account and Aadhaar invalid", "remedy": "Provide valid Aadhaar AND bank account to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-A3", "stage": "Payment, account", "reason": "IFSC invalid", "remedy": "Provide valid bank account and active IFSC to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-A4", "stage": "Payment, account", "reason": "Account holder expired", "remedy": "Banks must update NPCI mapper as inactive; family submits legal successor documentation", "responsible": "Bank", "destination": "Bank"},
  {"id": "P-A5", "stage": "Payment, account", "reason": "Invalid account", "remedy": "Contact bank branch for KYC update", "responsible": "Citizen", "destination": "Bank"},
  {"id": "P-A6", "stage": "Payment, account", "reason": "Rejected by bank, account number invalid", "remedy": "Provide valid bank account to department with passbook copy", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-A7", "stage": "Payment, account", "reason": "Rejected by bank, account closed", "remedy": "Provide active bank account to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-U1", "stage": "Payment, Aadhaar", "reason": "Aadhaar de-seeded", "remedy": "Bank: submit Aadhaar seeding consent form + NPCI mapper update", "responsible": "Citizen", "destination": "Bank"},
  {"id": "P-U2", "stage": "Payment, Aadhaar", "reason": "Both account and Aadhaar invalid", "remedy": "Provide valid Aadhaar AND bank account to department", "responsible": "Citizen", "destination": "Department"},
  {"id": "P-U3", "stage": "Payment, Aadhaar", "reason": "UID disabled for DBT", "remedy": "Bank: seeding + NPCI mapper update to reactivate DBT receipt", "responsible": "Citizen", "destination": "Bank"},
  {"id": "P-U4", "stage": "Payment, Aadhaar", "reason": "UID cancelled by UIDAI", "remedy": "Provide valid Aadhaar details after resolution with UIDAI", "responsible": "Citizen", "destination": "Department"}
]

with open('d:/projects-2/SCHEME SATHI/backend/app/rules/dbt_failure_rules.json', 'r', encoding='utf-8') as f:
    rules = json.loads(f.read())

for e in pfms_entries:
    code = e['id']
    rules[code] = {
        'failure_code': code,
        'category': 'pfms_taxonomy',
        'user_facing_reason': f"{code}: {e['reason']}",
        'questions': [],
        'conditions': {},
        'remedy': e['remedy'],
        'citizen_action': f"{e['remedy']} (Responsible: {e['responsible']})",
        'required_documents': [],
        'escalation': e['destination'],
        'source_reference': 'PFMS: DBT Validation/Payment Error/Rejection and action thereon'
    }

with open('d:/projects-2/SCHEME SATHI/backend/app/rules/dbt_failure_rules.json', 'w', encoding='utf-8') as f:
    json.dump(rules, f, indent=2)

print('done')
