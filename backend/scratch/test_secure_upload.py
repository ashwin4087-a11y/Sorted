import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000/api"
CITIZEN_ID = "00000000-0000-0000-0000-000000000000"

def test():
    # We will use multipart/form-data for upload
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    body = (
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"file\"; filename=\"test.pdf\"\r\n"
        f"Content-Type: application/pdf\r\n\r\n"
        f"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"citizen_id\"\r\n\r\n"
        f"{CITIZEN_ID}\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"document_type\"\r\n\r\n"
        f"aadhaar\r\n"
        f"--{boundary}\r\n"
        f"Content-Disposition: form-data; name=\"document_purpose\"\r\n\r\n"
        f"Test Security System\r\n"
        f"--{boundary}--\r\n"
    ).encode('utf-8')
    
    req = urllib.request.Request(f"{BASE_URL}/documents/upload", data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('x-citizen-id', CITIZEN_ID)
    
    print("Uploading...")
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode())
        print(res.status, data)
        doc_id = data["id"]
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())
        return
        
    print("Extracting...")
    req = urllib.request.Request(f"{BASE_URL}/documents/{doc_id}/extract", method='POST')
    req.add_header('x-citizen-id', CITIZEN_ID)
    try:
        res = urllib.request.urlopen(req)
        print(res.status, res.read().decode()[:100])
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())
        
    print("Deleting...")
    req = urllib.request.Request(f"{BASE_URL}/documents/{doc_id}", method='DELETE')
    req.add_header('x-citizen-id', CITIZEN_ID)
    try:
        res = urllib.request.urlopen(req)
        print(res.status)
    except urllib.error.HTTPError as e:
        print(e.code, e.read().decode())

if __name__ == "__main__":
    test()
