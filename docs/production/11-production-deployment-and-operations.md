# 11 — Production Deployment and Operations

> Evidence labels: doc 01 §0. Variable names below are **PROPOSED** unless confirmed by audit (`grep` command in doc 02 §4). Never put values in this file.

## 1. Environment variables (names + purpose)

### 1a. Found in the demo repo (VERIFIED IN REPOSITORY)

`DATABASE_URL`, `B2_ENDPOINT`, `B2_REGION`, `B2_BUCKET_NAME`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `NEXT_PUBLIC_APP_URL`, `LICENSE_SIGNING_PRIVATE_KEY`, `LICENSE_TOKEN_SECRET`, `DEMO_MACHINE_ID` (simulated machine id — must not exist in production), `VERCEL_PROJECT_PRODUCTION_URL`, `BACKEND_URL` (scripts), `CODE_SIGNING_PFX_PATH`, `CODE_SIGNING_PFX_PASSWORD`. The signing key and token secret **have hard-coded fallbacks** that must be removed (F-01, F-02); startup must fail if they are missing.

### 1b. Proposed production set

| Name (proposed)                                                                         | Purpose                                                                                | Exposure           |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------ |
| `DATABASE_URL` / `DIRECT_URL`                                                           | Prisma runtime (pooled) / migrations (direct)                                          | server / CI        |
| `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`, `B2_ENDPOINT`, `B2_REGION` | Backblaze B2 access | server |
| `STORAGE_PROVIDER`                                                                      | `b2` or `r2` during migration only                                                     | server             |
| `PACKAGE_URL_TTL_SECONDS`                                                               | Presigned URL lifetime (max 900)                                                       | server             |
| `LICENSE_SIGNING_PRIVATE_KEY`, `LICENSE_SIGNING_KEY_ID`                                 | Ed25519 token signing (new key pair)                                                   | server only        |
| `LICENSE_SIGNING_PUBLIC_KEY`                                                            | Embedded into installer builds                                                         | build              |
| `RAZORPAY_KEY_ID`                                                                       | Razorpay key id (used by Checkout; public by design)                                   | may be public      |
| `RAZORPAY_KEY_SECRET`                                                                   | Razorpay API secret                                                                    | **server only**    |
| `RAZORPAY_WEBHOOK_SECRET`                                                               | Razorpay webhook secret (distinct from API secret)                                     | **server only**    |
| `CRON_SECRET` (or equivalent)                                                           | Protects reconciliation/outbox routes                                                  | server only        |
| `EMAIL_API_KEY`, `EMAIL_FROM`                                                           | Transactional email (provider TBD, C-11)                                               | server only        |
| `CONTACT_TO_EMAIL`                                                                      | Business mailbox that receives the contact form (C-12)                                 | server             |
| `APP_BASE_URL`                                                                          | Canonical production URL and installer backend URL (replaces hard-coded prototype URL) | server/build       |
| `ADMIN_*`                                                                               | Analytics access mechanism (C-20)                                                      | server only        |
| `CODE_SIGNING_*`                                                                        | Code-signing certificate path/secret (outside repo)                                    | build machine only |

## 2. Local development

Node LTS, `npm ci`, `.env.local` from `.env.example` (names only), local PostgreSQL via the existing `docker-compose.yml` or a Supabase staging project, **never** real packages or live payment keys. The existing seed holds two demo products that are not the client's: replace it with the client's catalog once C-02/C-03 are answered, and keep demo data out of production. Windows is the development platform per the project rules; the installer is built with `csc.exe` (.NET Framework 4).

## 3. Hosting

Decision needed (doc 14): client's hosting (§02.5) vs Vercel. If Vercel: client-owned team/project, plan permitting commercial use (verify current terms), env vars per environment, preview deployments must not have production secrets. If other host: confirm Node/Next.js support, env management, logs, TLS.

## 4. Supabase

Client-owned project; region near users (India) if available; use pooled connection for the app and direct for migrations; do not expose service-role key to clients; review Row Level Security — recommended to keep all access server-side and enable RLS with no public policies for safety; confirm plan for backups/PITR (plan dependent).

## 5. Object Storage (Backblaze B2 Confirmed; R2 Cancelled per client decision 2026-10-24)

Doc 08. Client-owned account; MFA; scoped tokens; bucket private.

## 6. Domain and HTTPS

DNS for apex and `www` (redirect one to the other); TLS auto-managed by host; HSTS after verification; email DNS (SPF/DKIM/DMARC) in doc 09. Domain registrar access is a client dependency (§03).

## 7. Build and deploy

`npm ci` → lint → typecheck → tests → `prisma generate` → `next build` → deploy. Migrations via `prisma migrate deploy` as a controlled step (not on every request). Installer build and signing are separate, documented steps (doc 07 §12).

## 8. Backups and recovery

Database backups (provider + periodic `pg_dump` to client-controlled storage); test restore at least once before launch; Backblaze B2 packages: keep authoritative copies with the client (NDA-compliant); document RPO/RTO expectation with client.

## 9. Logging and monitoring

Structured logs with request IDs; no secrets/keys/URLs/emails in logs; error tracking and uptime check (provider choice and cost → client); alerts for webhook failures, paid-without-license orders, Backblaze B2 errors, activation spikes. Ongoing monitoring after support period is out of scope (§12.3).

## 10. Troubleshooting runbook (outline)

- **Payment paid but no license:** Run `npm run orders:reconcile` (or trigger `POST /api/cron/reconcile` with `Bearer CRON_SECRET`). Reconciler fetches external payment status and transactionally issues missing license.
- **Customer email failed:** Run `npm run email:process` (or trigger `POST /api/cron/email-outbox` with `Bearer CRON_SECRET`). Exponential backoff retries transient SMTP failures.
- **Installer can't download:** Check activation token validity, URL expiry (900s max), Backblaze B2 status.
- **Hash mismatch:** Verify DB sha256 vs object; re-upload.
- **Activation limit hit:** Support reset per policy (C-07).

## 11. Rollback

Redeploy previous build; DB: forward-fix preferred; restore from backup only with approval; storage: previous object version kept until verified.

## 12. Third-party ownership and costs (§06.4, §09)

| Service                                | Owner  | Cost bearer |
| -------------------------------------- | ------ | ----------- |
| Domain/DNS                             | client | client      |
| Hosting (Vercel or other)              | client | client      |
| Supabase                               | client | client      |
| Backblaze B2 (Object Storage)          | client | client      |
| Payment gateway (fees per transaction) | client | client      |
| Email + mailboxes                      | client | client      |
| WhatsApp Business (if used)            | client | client      |
| Code-signing certificate               | client | client      |

Unless the parties agree otherwise in writing. **REQUIRES CLIENT CONFIRMATION.**


## Phase 2 Environment Hygiene (VERIFIED IN REPOSITORY)
- `doc.txt` deleted from working tree.
- `.env.example` sanitized with variable names only (no values or credentials).
- `src/lib/env.ts` enforces fail-fast startup check printing missing variable names only.
- `scripts/check-pre-commit.sh` active to block accidental commit of credentials or private keys.
