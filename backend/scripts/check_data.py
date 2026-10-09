from app.database import SessionLocal
from app.models import Scheme

db = SessionLocal()
# Check sample scheme data quality
s = db.query(Scheme).first()
print("=== SAMPLE SCHEME ===")
print(f"Name: {s.name}")
print(f"Code: {s.scheme_code}")
print(f"Level: {s.level}")
print(f"State: {s.state}")
print(f"Ministry: {s.ministry}")
print(f"Category: {s.category}")
print(f"Tags type: {type(s.tags).__name__}, val: {s.tags}")
desc = s.description or ""
print(f"Description: {desc[:100]}...")
print(f"Eligibility type: {type(s.eligibility).__name__}")
eg = s.eligibility_general or ""
print(f"Eligibility_general: {eg[:100]}")
print(f"Benefits type: {type(s.benefits).__name__}")
print(f"Required_documents type: {type(s.required_documents).__name__}")
print(f"Application_process type: {type(s.application_process).__name__}")
print(f"App_mode: {s.application_mode}")
print(f"Official URL: {s.official_url}")
print(f"MyScheme URL: {s.myscheme_url}")
print()

# Check nulls/empties
null_desc = db.query(Scheme).filter(Scheme.description == None).count()
null_elig = db.query(Scheme).filter(Scheme.eligibility == None).count()
null_ben = db.query(Scheme).filter(Scheme.benefits == None).count()
null_docs = db.query(Scheme).filter(Scheme.required_documents == None).count()
null_state = db.query(Scheme).filter(Scheme.state == None).count()
null_ministry = db.query(Scheme).filter(Scheme.ministry == None).count()
null_cat = db.query(Scheme).filter(Scheme.category == None).count()
null_elig_gen = db.query(Scheme).filter(Scheme.eligibility_general == None).count()
null_exclusions = db.query(Scheme).filter(Scheme.exclusions == None).count()
null_faqs = db.query(Scheme).filter(Scheme.faqs == None).count()
null_app_mode = db.query(Scheme).filter(Scheme.application_mode == None).count()
null_app_proc = db.query(Scheme).filter(Scheme.application_process == None).count()
total = db.query(Scheme).count()

print("=== NULL ANALYSIS ===")
print(f"Total schemes: {total}")
print(f"Null descriptions: {null_desc}/{total}")
print(f"Null eligibility (JSONB): {null_elig}/{total}")
print(f"Null eligibility_general: {null_elig_gen}/{total}")
print(f"Null benefits: {null_ben}/{total}")
print(f"Null required_docs: {null_docs}/{total}")
print(f"Null state: {null_state}/{total}")
print(f"Null ministry: {null_ministry}/{total}")
print(f"Null category: {null_cat}/{total}")
print(f"Null exclusions: {null_exclusions}/{total}")
print(f"Null faqs: {null_faqs}/{total}")
print(f"Null app_mode: {null_app_mode}/{total}")
print(f"Null app_process: {null_app_proc}/{total}")

# Check eligibility field type (should be JSONB but might be stored as plain string)
print("\n=== ELIGIBILITY FIELD TYPE CHECK ===")
sample_schemes = db.query(Scheme).limit(5).all()
for ss in sample_schemes:
    elig = ss.eligibility
    print(f"  {ss.scheme_code}: type={type(elig).__name__}, value_start={str(elig)[:80]}")

db.close()
