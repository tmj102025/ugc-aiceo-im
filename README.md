# UGC Prompt Builder — ugc.aiceo.im

Web port of the **Style Prompt + Prompt Editor** feature from Flow Unlocked Chrome extension. Generates English prompts for UGC TikTok Shop covers (image & video) via Gemini 2.5 Flash. Users bring their own Gemini key. No image/video generation — copy the prompt into Sora / Veo / Midjourney / Imagen / Kling.

## Dev

```bash
npm install
cp .env.example .env.local   # fill in Google + PB creds
npm run dev                  # port 3004
```

## Deploy (Coolify, vps2)

- Dockerfile build pack
- FQDN `ugc.aiceo.im`
- Env vars: see `.env.example`
- PocketBase collection `ugc_leads` must exist at `db.aiceo.im` (fields: email, name, picture, login_count, generate_count, last_login_at, last_generate_at)
