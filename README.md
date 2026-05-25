# CallPilot AI

## Database

Run `backend/migrations/001_complete_schema.sql` in the Supabase SQL Editor.

Create a private Supabase Storage bucket named `documents` before using document uploads.

## Setting up Twilio webhooks for local development

Twilio needs a public HTTPS URL. For local development, install ngrok and run:

```bash
ngrok http 5050
```

Set `PUBLIC_BASE_URL` in `backend/.env` to the HTTPS ngrok URL, then restart the backend.

## Docker

```bash
docker-compose up --build
```
