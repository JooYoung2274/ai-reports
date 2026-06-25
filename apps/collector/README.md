# Collector

Build: `pnpm build`. Configure `.env` (INGEST_URL, UPLOADED_BY).
Cron (every 30 min): `*/30 * * * * cd /path/apps/collector && node -r dotenv/config dist/index.js`
