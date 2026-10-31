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

## 13. Phase 6 Database Migration Strategy, Baselining & CSP Scoping (VERIFIED IN REPOSITORY & SUPABASE)

### 13a. Supabase Database Migration & Baselining Strategy
- **Target Supabase Environment:** Dedicated project `oysfvbhmnyowhfdkvsdk` in `ap-south-1` (Mumbai). Direct connection configured via `DIRECT_URL` (port 5432) for schema migrations; transaction pooler configured via `DATABASE_URL` (port 6543) for runtime.
- **Pre-Migration Safety & Backup:**
  - Full logical schema and data backup created before applying migrations using PostgreSQL client binary (`/usr/lib/postgresql/18/bin/pg_dump` targeting PostgreSQL 17.11 server).
  - Backup stored outside the Git repository at `/home/projects/backups/supabase_navbrahmi_pre_migration_20261031.sql` with restrictive permissions (`chmod 0600`, directory `chmod 0700`).
  - Verified preservation of all 13 products, 20 packages, 5 audit events, and 33 rate-limit buckets.
- **Baseline Migration Reconciliation:**
  - Initial database tables were established via `prisma db push` during early development, leaving `_prisma_migrations` uninitialized on the remote database.
  - Empirically verified via `npx prisma migrate diff` that existing database schema matched migrations 1 through 4 with zero diff.
  - Baselined existing migrations on Supabase using official Prisma migration resolve commands:
    ```bash
    npx prisma migrate resolve --applied 20260819083712_init
    npx prisma migrate resolve --applied 20260819092554_add_activation
    npx prisma migrate resolve --applied 20261024093000_expand_schema_phase2
    npx prisma migrate resolve --applied 20261024180000_license_encryption
    ```
- **Phase 6 Schema Deployment:**
  - Generated `prisma/migrations/20261031080000_refund_requests_and_license_resets/migration.sql` adding `RefundRequestStatus` enum, `RefundRequest` table, and `installedAt`, `lastResetAt`, `resetCount` fields on `License`.
  - Applied migration to Supabase via `npx prisma migrate deploy`.
  - Migration status verified: `Database schema is up to date!` (5 migrations applied, 0 pending).
  - Clean scratch database reproduction verified on local PostgreSQL (`localhost:5432/test_scratch_clean`).

### 13b. Content-Security-Policy (CSP) Environment Scoping
- **Root Cause of React `eval()` Warning:** In development mode (`npm run dev`), React runtime debugging and Hot Module Replacement require `eval()` to reconstruct callstacks across environments. When served with a static CSP header lacking `'unsafe-eval'`, the browser blocks `eval()` and logs a console warning.
- **Environment-Specific Scoping (`next.config.mjs`):**
  - Implemented `buildCspHeader()` helper dynamically checking execution environment:
    - **Development (`NODE_ENV === 'development'` without Vercel preview/production):** Permits `'unsafe-eval'` in `script-src` exclusively for React debug diagnostics and callstack reconstruction.
    - **Production & Vercel Preview (`NODE_ENV === 'production'` or `VERCEL_ENV === 'preview' | 'production'`):** Strictly omits `'unsafe-eval'` from `script-src`. Production security policy remains completely unweakened.
  - Verified via automated unit tests in `tests/unit/csp-header.test.ts`.

### 13c. Supabase Product Catalog & Package Data Reconciliation (VERIFIED IN SUPABASE & B2)
- **Root Cause of Inconsistency:** Product records in Supabase were originally seeded on 2026-10-24 with legacy prototype price ₹480 (48000 paise). When client decision C-02 (₹472 / 47200 paise) and C-03 (Kannada and Tulu separation) were confirmed, catalog code was updated, but the remote Supabase database rows had not yet been reconciled against the authoritative catalog.
- **Pre-Reconciliation Safety & Backup:**
  - Full logical database backup created before executing reconciliation: `/home/projects/backups/supabase_navbrahmi_pre_reconciliation_20261031.sql` (305 KB, mode 0600) via `/usr/lib/postgresql/18/bin/pg_dump` targeting PostgreSQL 17.11 server.
- **Reconciliation Plan & Implementation (`scripts/reconcile-supabase-products.ts`):**
  - **All Confirmed Standalone Products:** Reconciled to ₹472.00 (47200 paise), currency `INR`, `isActive = true` across Ashokan Brahmi, Bengali, Devanagari/Hindi, Gujarati, Kannada, Malayalam, Modi-Marathi, Oriya/Odia, Punjabi/Gurmukhi, Sharada, Telugu, and Tulu.
  - **Catalog Separation (C-03):** Reconciled Kannada and Tulu as two distinct standalone products with independent package mappings.
  - **Legacy Combined Product Preservation:** Row `cmvm9tawm0004p7s4me6o84kt` (formerly `Kannada, Tulu and Devanagari`) preserved without deletion. Renamed to code `KANNADA_TULU_LEGACY`, slug `kannada-tulu-legacy`, `priceMinor = null`, `isActive = false`. Zero rows deleted; zero foreign keys or historical references broken; completely blocked from checkout.
  - **Unresolved Bundle Withholding (C-03):** `TAMIL_AND_GRANTHA` set to `price = 0`, `priceMinor = null`, `isActive = true` (catalog listed with note), checkout withheld (`PRODUCT_BUNDLE_UNCONFIRMED`).
  - **Real Package Delivery & Registration (Backblaze B2):** Built real deterministic packages containing MSKLC binaries + C-29 approved fonts (`NotoSansKannada-RegularNJ.ttf` for Kannada, `Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf` for Tulu), uploaded to Backblaze B2 `navbrahmi-prod-packages`, verified remote SHA-256 and size, and registered in `ProductPackage`.
  - **Final Package Matrix:** Exactly 12 purchasable products with 2 verified packages each (x64 and x86), totaling 24 registered packages in Supabase and B2.

### 13d. Row Level Security (RLS) & Least-Privilege Database Hardening (VERIFIED IN SUPABASE)
- **Security Audit Findings:**
  - Supabase Table Editor previously indicated tables had RLS disabled (`UNRESTRICTED`).
  - Database audit revealed default grants allowed `anon` and `authenticated` roles `ALL PRIVILEGES` on `public` tables, which would have allowed unauthorized access via Supabase's PostgREST Data API (`/rest/v1`).
- **Architectural Access Model:**
  - Nav Brahmi is a server-side Next.js application using Prisma. Prisma connects via direct/pooler PostgreSQL connection as the `postgres` superuser/table owner.
  - The client application never uses the Supabase PostgREST Data API or client-side Supabase JS libraries.
- **Remediation Migration (`prisma/migrations/20261031090000_enable_rls_and_revoke_public_grants/migration.sql`):**
  - Enabled Row Level Security on all 15 public tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
  - Revoked all privileges on all tables, sequences, and routines in schema `public` from PostgREST roles `anon` and `authenticated`.
  - Altered default privileges so newly created tables/sequences in `public` schema automatically deny access to `anon` and `authenticated`.
  - Deployed via `npx prisma migrate deploy` and verified via `npx prisma migrate status` (6 migrations applied, 0 pending).
  - Empirically verified: All 15 tables report `rowsecurity = true`; `anon` and `authenticated` hold 0 grants; Prisma server-side operations continue to operate with 100% full access.


