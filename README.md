# Problem Statement

Sensitive documents (e.g., financial reports, confidential memos) are sent to groups via email or WhatsApp.
No control once it’s sent (anyone can forward, save, screenshot).
No audit trail of who accessed it.

# Flow Chart
┌────────────────────┐
│   Admin Logs In     │
└─────────┬──────────┘
          │ (JWT Auth)
          v
┌────────────────────────┐
│ Admin Uploads Document │
└─────────┬──────────────┘
          │
          │ Sets:
          │ - Groups/Recipients
          │ - View-once / Expiry
          │ - Watermark option
          v
┌──────────────────────────────────────┐
│ Backend Stores File & Metadata       │
│ - Saves file to server/storage       │
│ - Saves metadata to DB (permissions) │
└─────────┬────────────────────────────┘
          │
          v
┌────────────────────────────────────────────────┐
│ Backend Generates Unique Secure Links per User │
│ (tokenized URL with expiry rules)              │
└─────────┬──────────────────────────────────────┘
          │
          │ Sends:
          │ - WhatsApp Message (via API)
          │ - Email with secure link
          v
┌────────────────────────────┐
│ Recipient Receives Link     │
└─────────┬──────────────────┘
          │ Click Link
          v
┌─────────────────────────────────────────┐
│ Secure Web Viewer Opens Document         │
│ - Streams file (no direct URL)           │
│ - Disables download/right-click/print    │
│ - Watermarks recipient info on file      │
└─────────┬───────────────────────────────┘
          │
          │ If “View Once”:
          │ - Link auto-expires after first view
          │ - Or expires after time limit
          v
┌────────────────────────────────────────┐
│ Backend Logs Access in Audit Logs DB    │
│ (user, timestamp, IP/device, action)    │
└─────────┬──────────────────────────────┘
          │
          │ Admin Can View Logs Dashboard:
          │ - Who accessed what & when
          │ - Revoke links anytime
          v
┌───────────────────────────────┐
│ Compliance/Management Reports │
└───────────────────────────────┘
