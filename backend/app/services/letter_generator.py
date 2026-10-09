def generate_letter(letter_type: str, ctx: dict) -> dict:
    is_ta = ctx.get("language") == "ta"
    draft_notice = "செயற்கை நுண்ணறிவால் உருவாக்கப்பட்ட வரைவு: சமர்ப்பிக்கும் முன் சரிபார்க்கவும்." if is_ta else "AI-generated draft: verify before submission."

    case_ref = ctx.get("caseRef", "")
    date = ctx.get("date", "")
    citizen_name = ctx.get("citizenName", "[Citizen Name]")
    location = ctx.get("location", "District" if not is_ta else "தமிழ்நாடு")
    scheme_name = ctx.get("schemeName", "Scheme")
    bank_name = ctx.get("bankName", "Branch" if not is_ta else "வங்கி கிளை")
    account_number_masked = ctx.get("accountNumberMasked", "XXXX XXXX 1204")
    aadhaar_masked = ctx.get("aadhaarMasked", "XXXX XXXX 8912")
    failure_code = ctx.get("failureCode", "P-U1")

    if letter_type == "BANK_REQUEST":
        if is_ta:
            return {
                "title": "ஆதார் இணைப்பு மற்றும் NPCI மேப்பர் புதுப்பித்தல் கோரிக்கை கடிதம்",
                "letterType": "BANK_REQUEST",
                "language": "ta",
                "caseRef": case_ref,
                "date": date,
                "toAuthority": f"வங்கி கிளை மேலாளர் அவர்களுக்கு,\n{bank_name},\n{location}.",
                "subject": f"பொருள்: கணக்கு எண் {account_number_masked}-ல் ஆதார் இணைப்பு (Aadhaar Seeding) மற்றும் NPCI DBT மேப்பரில் செயல்படுத்துதல் கோரி.",
                "bodyParagraphs": [
                    "மதிப்பிற்குரிய ஐயா / அம்மா,",
                    f"நான், {citizen_name}, மேற்கண்ட வங்கிக் கிளையில் சேமிப்புக் கணக்கு வைத்துள்ளேன். நான் {scheme_name} திட்டத்தின் பயனாளியாவேன். எனது நலத்திட்ட நிதி அரசு DBT மூலம் வழங்கப்படவுள்ளது.",
                    f"தற்போது PFMS / NPCI ஆய்வில் எனது ஆதார் எண் ({aadhaar_masked}) இந்த வங்கிக் கணக்குடன் NPCI மேப்பரில் செயலில் இல்லை ({failure_code} - Aadhaar de-seeded) என அறிவிக்கப்பட்டுள்ளது. இதனால் எனது உதவித்தொகை நிறுத்தி வைக்கப்பட்டுள்ளது.",
                    "எனவே, எனது ஆதார் எண்ணை எனது கணக்குடன் இணைத்து (Aadhaar Seeding) மற்றும் NPCI மேப்பரில் (NPCI DBT Mapper) உடனடியாக செயல்படுத்துமாறு (Enable) தாழ்மையுடன் கேட்டுக்கொள்கிறேன். இதற்கான எனது ஒப்புதல் படிவத்தை இத்துடன் இணைத்துள்ளேன்.",
                    "இக்கோரிக்கை நிறைவேற்றப்பட்டதற்கான ஒப்புகைச் சீட்டினை (Acknowledgement Slip) வழங்குமாறு கேட்டுக்கொள்கிறேன்."
                ],
                "enclosures": [
                    "1. ஆதார் அட்டை நகல் (சுய கையொப்பமிட்டது)",
                    "2. வங்கிக் கணக்குப் புத்தகத்தின் முதல் பக்க நகல்",
                    "3. பூர்த்தி செய்யப்பட்ட ஆதார் இணைப்பு ஒப்புதல் படிவம் (Annexure I)",
                    "4. திட்ட பதிவு ஒப்புகைச் சீட்டு"
                ],
                "signatureBlock": f"இப்படிக்கு,\n\n{citizen_name}\nபயனாளி\nநாள்: {date}",
                "draftNotice": draft_notice
            }
        return {
            "title": "BANK REQUEST: Aadhaar Seeding & NPCI Mapper Registration",
            "letterType": "BANK_REQUEST",
            "language": "en",
            "caseRef": case_ref,
            "date": date,
            "toAuthority": f"The Branch Manager,\n{bank_name},\n{location}.",
            "subject": f"Subject: Request for Aadhaar Seeding and NPCI DBT Mapper Activation for A/C {account_number_masked}.",
            "bodyParagraphs": [
                "Respected Sir/Madam,",
                f"I, {citizen_name}, maintain a savings bank account with your branch. I am a registered beneficiary under the government scheme \"{scheme_name}\". My direct benefit transfer (DBT) instalments are disbursed through the Public Financial Management System (PFMS).",
                f"My payment has failed with status code {failure_code} (\"Aadhaar de-seeded / Not Active in NPCI Mapper\"). As per standard operating procedures issued by the Ministry of Finance and NPCI, my Aadhaar number ({aadhaar_masked}) must be seeded with my bank account and updated in the NPCI beneficiary mapper.",
                "I hereby provide my formal consent and request your office to seed my Aadhaar with my account and enable NPCI mapping for DBT receipt at the earliest.",
                "Kindly issue an official acknowledgement receipt certifying that the seeding and NPCI mapper request has been initiated in CBS."
            ],
            "enclosures": [
                "1. Self-attested copy of Aadhaar Card",
                "2. Copy of Bank Passbook front page",
                "3. Duly filled Aadhaar Seeding & NPCI Mandate Consent Form",
                "4. Scheme Registration Acknowledgement Slip"
            ],
            "signatureBlock": f"Yours faithfully,\n\n{citizen_name}\nBeneficiary\nDate: {date}",
            "draftNotice": draft_notice
        }

    if letter_type == "DEPARTMENT_REASON_REQUEST":
        if is_ta:
            return {
                "title": "PFMS கட்டணத் தோல்விக்கான காரணத்தை கோரும் மனு",
                "letterType": "DEPARTMENT_REASON_REQUEST",
                "language": "ta",
                "caseRef": case_ref,
                "date": date,
                "toAuthority": f"மண்டல வளர்ச்சி அலுவலர் / திட்ட அலுவலர் அவர்களுக்கு,\n{scheme_name} துறை அலுவலகம்,\n{location}.",
                "subject": f"பொருள்: {scheme_name} திட்டத்தின் கீழ் பணம் வராததற்கான PFMS நிராகரிப்பு காரணக் குறியீட்டை (Failure Reason Code) வழங்குமாறு கோருதல்.",
                "bodyParagraphs": [
                    "மதிப்பிற்குரிய அலுவலர் அவர்களுக்கு,",
                    f"நான், {citizen_name}, {scheme_name} திட்டத்திற்கு வெற்றிகரமாக விண்ணப்பித்து எனது விண்ணப்பம் ஏற்கப்பட்டது (விண்ணப்ப எண்: {case_ref}). ஆயினும், கடந்த தவணைகளுக்கான நிதி எனது வங்கிக் கணக்கில் வரவு வைக்கப்படவில்லை.",
                    "எந்த காரணத்தினால் நிதி வரவு வைக்கப்படவில்லை என்ற அதிகாரப்பூர்வ பிழைக் குறியீடு (PFMS Rejection Code / Sub-reason) எனக்கு தெரிவிக்கப்படவில்லை.",
                    "இக்குறையினை நான் நிவர்த்தி செய்வதற்கு ஏதுவாக, PFMS இணையத்தில் பதிவாகியுள்ள எனது கட்டணத் தோல்விக்கான துல்லியமான காரணம் மற்றும் குறியீட்டினை எழுத்துப்பூர்வமாக வழங்கி உதவுமாறு பணிவுடன் கேட்டுக்கொள்கிறேன்."
                ],
                "enclosures": [
                    "1. திட்ட விண்ணப்ப ஒப்புகை நகல்",
                    "2. ஆதார் அட்டை நகல்",
                    "3. வங்கி கணக்கு புத்தக நகல் (கடைசி பரிவர்த்தனை வரை)"
                ],
                "signatureBlock": f"இப்படிக்கு,\n\n{citizen_name}\nவிண்ணப்பதாரர்\nநாள்: {date}",
                "draftNotice": draft_notice
            }
        return {
            "title": "DEPARTMENT REQUEST: Requisition for PFMS Payment Return Reason",
            "letterType": "DEPARTMENT_REASON_REQUEST",
            "language": "en",
            "caseRef": case_ref,
            "date": date,
            "toAuthority": f"To The Scheme Nodal Officer / Block Development Officer,\n{scheme_name} Directorate,\n{location}.",
            "subject": f"Subject: Requisition for official PFMS payment rejection reason and failure code for Application Ref: {case_ref}.",
            "bodyParagraphs": [
                "Respected Officer,",
                f"I, {citizen_name}, am a sanctioned beneficiary of the {scheme_name} scheme. Although my application was formally approved, the scheduled benefit instalments have not been credited to my bank account.",
                "The citizen portal does not display the granular PFMS return/rejection code or bank response sub-reason necessary to initiate corrective measures.",
                "In accordance with DBT grievance redressal guidelines, I kindly request you to inspect the PFMS portal for my beneficiary record and provide me with the exact failure code and reason so that I may immediately resolve the issue with the concerned bank or office."
            ],
            "enclosures": [
                "1. Scheme Sanction / Application Acknowledgement",
                "2. Self-attested Aadhaar Card copy",
                "3. Updated Bank Account Passbook statement"
            ],
            "signatureBlock": f"Yours faithfully,\n\n{citizen_name}\nApplicant\nDate: {date}",
            "draftNotice": draft_notice
        }

    # Default: DEPARTMENT_CORRECTION
    if is_ta:
        return {
            "title": "துறை சார்ந்த திருத்தம்: வங்கி விவரங்கள் & சுயவிவர திருத்தம்",
            "letterType": "DEPARTMENT_CORRECTION",
            "language": "ta",
            "caseRef": case_ref,
            "date": date,
            "toAuthority": f"திட்ட அனுமதி வழங்கும் அதிகாரி அவர்களுக்கு,\n{scheme_name} பிரிவு,\n{location}.",
            "subject": f"பொருள்: {scheme_name} திட்டத்திற்கான திருத்தப்பட்ட வங்கி விவரங்கள் மற்றும் அடையாள ஆவணங்களை சமர்ப்பித்தல் (விண்ணப்ப எண்: {case_ref}).",
            "bodyParagraphs": [
                "மதிப்பிற்குரிய ஐயா / அம்மா,",
                f"நான், {citizen_name}, சமர்ப்பித்த பயனாளிகள் விவரங்களில் பிழை ஏற்பட்டுள்ளது ({failure_code} / சுயவிவர பிழை). இதைச் சரிசெய்வதற்காக, நடப்பில் உள்ள எனது வங்கி கணக்கு புத்தகம் மற்றும் அடையாள ஆவணங்களை மாநில பயனாளிகள் தரவுத்தளத்தில் புதுப்பிக்க இத்துடன் சமர்ப்பிக்கிறேன்.",
                "வரும் தவணைகள் தடையின்றி வழங்கப்படுவதை உறுதிசெய்ய, எனது வங்கிக் கணக்கு மற்றும் IFSC விவரங்களை PFMS தரவுத்தளத்தில் புதுப்பிக்குமாறு கேட்டுக்கொள்கிறேன்."
            ],
            "enclosures": [
                "1. சரியான IFSC குறியீட்டுடன் கூடிய நடப்பு வங்கி புத்தக நகல்",
                "2. ஆதார் அட்டை நகல்",
                "3. திட்ட விண்ணப்ப ஒப்புகை நகல்"
            ],
            "signatureBlock": f"இப்படிக்கு,\n\n{citizen_name}\nபயனாளி\nநாள்: {date}",
            "draftNotice": draft_notice
        }
        
    return {
        "title": "DEPARTMENT CORRECTION: Bank Details & Demographic Rectification",
        "letterType": "DEPARTMENT_CORRECTION",
        "language": "en",
        "caseRef": case_ref,
        "date": date,
        "toAuthority": f"To The Scheme Sanctioning Authority,\n{scheme_name} Cell,\n{location}.",
        "subject": f"Subject: Submission of rectified bank details and identity documents for {scheme_name} (Ref: {case_ref}).",
        "bodyParagraphs": [
            "Respected Sir/Madam,",
            f"I, {citizen_name}, with reference to the validation error encountered in my beneficiary record ({failure_code} / Demographic discrepancy), submit herewith my rectified, active bank passbook and identity proof for updating in the state beneficiary master.",
            "I request that my bank account and IFSC details be updated in the PFMS master list so that upcoming benefit instalments may be processed without interruption."
        ],
        "enclosures": [
            "1. Copy of Active Bank Passbook with valid IFSC",
            "2. Copy of Aadhaar Card",
            "3. Application acknowledgement receipt"
        ],
        "signatureBlock": f"Yours faithfully,\n\n{citizen_name}\nBeneficiary\nDate: {date}",
        "draftNotice": draft_notice
    }
