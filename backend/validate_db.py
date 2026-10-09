from sqlalchemy import create_engine, text
import json

def run_queries():
    engine = create_engine("postgresql+psycopg://sorted:YourNewPassword123%21@localhost:5432/sorted")
    with engine.connect() as conn:
        print("1. Total Schemes:")
        res = conn.execute(text("SELECT COUNT(*) FROM schemes;"))
        print(res.scalar())
        
        print("\n2. Level Breakdown:")
        res = conn.execute(text("SELECT level, COUNT(*) FROM schemes GROUP BY level ORDER BY level;"))
        for row in res:
            print(f"{row[0]}: {row[1]}")
            
        print("\n3. Missing/Null/Empty Counts:")
        queries = {
            "Total Schemes": "SELECT COUNT(*) FROM schemes",
            "NULL/Empty Name": "SELECT COUNT(*) FROM schemes WHERE name IS NULL OR name = ''",
            "NULL/Empty Description": "SELECT COUNT(*) FROM schemes WHERE description IS NULL OR description = ''",
            "NULL/Empty Benefits": "SELECT COUNT(*) FROM schemes WHERE benefits IS NULL OR benefits::text = 'null' OR benefits::text = '{}' OR benefits::text = '[]'",
            "NULL/Empty Eligibility": "SELECT COUNT(*) FROM schemes WHERE eligibility IS NULL OR eligibility::text = 'null' OR eligibility::text = '{}' OR eligibility::text = '[]'",
            "NULL/Empty Official URL": "SELECT COUNT(*) FROM schemes WHERE official_url IS NULL OR official_url = ''",
            "NULL/Empty MyScheme URL": "SELECT COUNT(*) FROM schemes WHERE myscheme_url IS NULL OR myscheme_url = ''",
            "Duplicate Scheme Codes (Slugs)": "SELECT COUNT(*) FROM (SELECT scheme_code FROM schemes GROUP BY scheme_code HAVING COUNT(*) > 1) AS sq",
            "Duplicate Official URLs": "SELECT COUNT(*) FROM (SELECT official_url FROM schemes WHERE official_url IS NOT NULL AND official_url != '' GROUP BY official_url HAVING COUNT(*) > 1) AS sq",
            "Duplicate MyScheme URLs": "SELECT COUNT(*) FROM (SELECT myscheme_url FROM schemes WHERE myscheme_url IS NOT NULL AND myscheme_url != '' GROUP BY myscheme_url HAVING COUNT(*) > 1) AS sq"
        }
        for name, query in queries.items():
            res = conn.execute(text(query))
            print(f"{name}: {res.scalar()}")
            
        print("\n4. Representative Records:")
        records_to_check = [
            "SELECT name, scheme_code, level, ministry, state, application_mode, tags, description, eligibility, eligibility_general, exclusions, benefits, application_process, required_documents, faqs, official_url, myscheme_url FROM schemes WHERE level='Central Government' AND name ILIKE '%KISAN%' LIMIT 1",
            "SELECT name, scheme_code, level, ministry, state, application_mode, tags, description, eligibility, eligibility_general, exclusions, benefits, application_process, required_documents, faqs, official_url, myscheme_url FROM schemes WHERE level='State / UT Government' AND state ILIKE '%Tamil Nadu%' LIMIT 1",
            "SELECT name, scheme_code, level, ministry, state, application_mode, tags, description, eligibility, eligibility_general, exclusions, benefits, application_process, required_documents, faqs, official_url, myscheme_url FROM schemes WHERE level='State / UT Government' AND state ILIKE '%Maharashtra%' LIMIT 1"
        ]
        
        for q in records_to_check:
            res = conn.execute(text(q))
            row = res.mappings().fetchone()
            if row:
                print(f"\n--- {row['name']} ---")
                for k, v in row.items():
                    print(f"{k}: {'<HAS_DATA>' if v else '<EMPTY>'}")
            else:
                print(f"No match for query: {q}")
        
if __name__ == "__main__":
    run_queries()
