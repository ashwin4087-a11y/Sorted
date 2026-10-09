def scan_file_for_malware(data: bytes, mime_type: str) -> bool:
    """
    Mocks a ClamAV scan.
    Returns True if safe, False if malware detected.
    For this test, we consider files starting with EICAR signature as malware.
    """
    eicar = b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    if data.startswith(eicar):
        return False
    return True
