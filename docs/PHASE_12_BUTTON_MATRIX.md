# Phase 12 Button Matrix

| Button | Route | Frontend Action | API | Backend Action | Success | Failure |
|---|---|---|---|---|---|---|
| Continue with Google | /login | Google OAuth | POST /api/auth/google | Create Operator | Dashboard/Gateway | Error message |
| Verify with DigiLocker | Gateway | OAuth | POST /api/digilocker/authorize | Initiate DL session | Redirect DL | Error message |
| Sync DigiLocker | Profile | Sync flow | POST /api/digilocker/authorize | Refresh docs | Profile updated | Error message |
| Apply Now | Schemes | Precheck | POST /applications | Create application | Health Check | 409/403 Error |
| Disconnect DigiLocker | Profile | Disconnect | POST /api/digilocker/disconnect | Mark false | Redirect Gateway | Error message |
