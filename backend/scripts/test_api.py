import requests

# Test /api/schemes
r = requests.get('http://localhost:8000/api/schemes?limit=3')
d = r.json()
print(f"GET /api/schemes => Status: {r.status_code}")
print(f"  Total: {d.get('total')}")
print(f"  Items count: {len(d.get('items', []))}")
for item in d.get('items', []):
    print(f"  - {item['name']}")
    print(f"    id: {item['id']}")
    print(f"    state: {item.get('state')}, level: {item.get('level')}")
    print(f"    category: {item.get('category')}, tags: {item.get('tags')}")
    print(f"    has description in summary: {'description' in item}")

# The SchemePage returns SchemeSummary which doesn't include description
# Check if the SchemeDetail endpoint works
if d.get('items'):
    sid = d['items'][0]['id']
    r2 = requests.get(f'http://localhost:8000/api/schemes/{sid}')
    detail = r2.json()
    print(f"\nGET /api/schemes/{sid} => Status: {r2.status_code}")
    print(f"  Name: {detail.get('name')}")
    print(f"  Description: {str(detail.get('description',''))[:120]}...")
    print(f"  Eligibility type: {type(detail.get('eligibility')).__name__}")
    print(f"  Benefits type: {type(detail.get('benefits')).__name__}")
    print(f"  Docs type: {type(detail.get('required_documents')).__name__}")

# Check citizens to test eligible endpoint
r3 = requests.get('http://localhost:8000/api/citizens', 
                   headers={'Authorization': 'Bearer test'})
print(f"\nGET /api/citizens => Status: {r3.status_code}")
if r3.status_code == 200:
    citizens = r3.json()
    print(f"  Citizens count: {len(citizens)}")
    if citizens:
        print(f"  First citizen: {citizens[0]}")
