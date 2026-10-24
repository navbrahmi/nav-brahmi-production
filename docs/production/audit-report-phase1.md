# Phase 1 Audit Confirmation and Security Triage Report

**Project:** NAV BRAHMI Website + Software Purchase, Licensing, Machine-Bound Activation & Driver Distribution  
**Date of Audit:** 2026-10-24  
**Audit Target:** Repository workspace & demo prototype codebase (`client-driver-website-main.zip`)  
**Auditor:** Antigravity AI Pair Programmer (Advanced Agentic Coding)  
**Branch:** `phase-1-audit-confirmation`  
**Evidence Standard:** Every claim labelled per `docs/production/01-project-context-and-requirements.md` §0. No code changes executed during this audit.

---

## 1. Executive Summary

This report establishes the baseline security, technical architecture, and agreement traceability for NAV BRAHMI, confirming and extending the preliminary findings in `docs/production/02-existing-system-audit.md`.

The codebase provided in `client-driver-website-main.zip` is confirmed to be an **early-stage demonstration prototype**. While it establishes core concepts—specifically a two-tier machine identity hash (Registry MachineGuid + WMI System UUID), an Ed25519 token signing structure, an S3/B2 presigned download pattern, and an AnyCPU C# bootstrapper (`Setup.exe`) that executes architecture-specific MSIs—**it cannot be operated in production without a comprehensive security rebuild**:

1. **Compromised Secrets & Free Licensing:** The prototype Ed25519 private key is hard-coded in source (`src/lib/keys.ts:49`), the HMAC secret is hard-coded in source and compiled inside `Setup.exe` (`Requirements/windows-driver/bootstrapper/Program.cs:40`), and active Backblaze B2 credentials are held unencrypted in `doc.txt` (`doc.txt:1-12`). The checkout endpoint (`/api/purchase`) generates active software licenses for free with zero payment gateway interaction.
2. **Missing Production Scope:** None of the client's 14 delivered products, brand guidelines (#E51055 / #FFFFFF), Razorpay payment processing, transactional emails, tax invoicing, customer contact form, or agreement pages (PG-01 to PG-08) exist in the codebase.
3. **Installer Hardening Gaps:** The Windows bootstrapper accepts unsigned payloads if signatures are omitted (`Program.cs:200`), does not cryptographically verify the server's Ed25519 token (`Program.cs:451`), assumes ARM64 can execute AMD64 MSIs without verification (`Program.cs:628`), and treats MSI exit code 1638 ("already installed") as a new success without post-install layout validation.

All 26 audit findings (**F-01 through F-26**) are **CONFIRMED** with exact file paths and line numbers.

---

## 2. Repository Inventory and Git History (Tasks 1, 2, 13b)

### 2a. Workspace & Git Tracking Inventory
- **Workspace Path:** `/home/projects/projects/Kreovi-NavBrahmi2026-10-17/files`
- **Initial Git State:** `VERIFIED IN REPOSITORY` — The workspace was delivered without a Git repository (`.git` directory was absent; `git status` returned `fatal: not a git repository`).
- **Codebase Source:** Delivered as a GitHub snapshot zip `client-driver-website-main.zip` (85 files, 342,906 bytes uncompressed) without `.git` history.
- **Local Tracking Initialized:** A clean Git repository was initialized in `files/` on branch `phase-1-audit-confirmation` to enforce Phase 1 rule 5 (additive markdown tracking with strict `.gitignore` protection).

### 2b. Confidentiality Check (Risk R1)
- **Driver Packages in Tracking:** `VERIFIED IN REPOSITORY` — No client driver packages or MSI archives were tracked in the prototype snapshot. `.gitignore` in `client-driver-website-main/.gitignore:41-43` specifically ignores two prototype filenames (`brahmi-tamil-grantha-driver-package.zip`, `kharoshthi-driver-package.zip`). The 14 client delivery packages in `Software/` are kept strictly outside Git.
- **Compiled Executable Tracked:** `CONFIRMED` — `Requirements/windows-driver/Setup.exe` (34,272 bytes) was committed and tracked in the repository snapshot.
- **Unignored Credential File:** `CONFIRMED` — `doc.txt` (196 bytes) containing live Backblaze B2 credentials was tracked and NOT listed in `.gitignore`.
- **Remote Repository Status:** `UNKNOWN / REQUIRES DEVELOPER CONFIRMATION (C-38)` — Because the codebase was provided as a zip file without Git remotes, the remote URL and its public/private visibility cannot be confirmed from the local environment.

---

## 3. Secrets Scan and Cryptographic Audit (Tasks 3, 7)

Every finding below has been verified against active source code. Secret values are intentionally omitted per Standing Rule 4:

| Finding ID | Severity | Description | Exact Source Location | Remediation Plan |
|---|---|---|---|---|
| **F-01** | **Critical** | Ed25519 private signing key hard-coded in source as default fallback (`DEFAULT_DEMO_PRIVATE_KEY_PEM`). Anyone with repository access can sign valid machine activation tokens. | `src/lib/keys.ts:49-55` | Treat key as permanently compromised. Generate new Ed25519 keypair in Phase 2; store private key strictly in environment variables; fail startup if missing. |
| **F-02** | **Critical** | HMAC-SHA256 secret hard-coded in server source (`license.ts`) and client installer source (`Program.cs`). Present inside every compiled `Setup.exe`. Allows arbitrary payload forging. | `src/lib/license.ts:30, 129`<br>`Program.cs:40, 125` | Eliminate client-side HMAC secret. Redesign installer authorization using server-issued asymmetric signed tokens (Phase 5). |
| **F-03** | **Critical** | `doc.txt` in repository root contains live Backblaze B2 application credentials (`keyID`, `applicationKey`, `bucketName`, `Endpoint`). Not git-ignored. | `doc.txt:1-12` | Rotate the Backblaze B2 application key immediately. Purge `doc.txt` from repository and working copy. |
| **F-19** | **Medium** | Prototype Vercel domain (`https://client-driver-website.vercel.app`) hard-coded across multiple runtime and test files. | `src/lib/license.ts:191`<br>`Program.cs:31`<br>`setup.ps1:26, 402`<br>`scripts/test-live-production-e2e.ts:10`<br>`scripts/test-backend-url-behavior.ts:15, 90`<br>`scripts/diagnose-vercel.ts:4` | Centralize URL resolution behind validated `APP_BASE_URL` environment variable (Phase 2). |

---

## 4. Stack and Dependency Audit (Task 4)

- **Framework:** Next.js `^14.2.18` (App Router) + React `18.3.1` + TypeScript `5.6.3`.
- **Database Layer:** Prisma `^5.22.0` with `@prisma/client`.
- **Storage SDK:** `@aws-sdk/client-s3` (`^3.699.0`) + `@aws-sdk/s3-request-presigner` (`^3.699.0`) configured for Backblaze B2 S3 API.
- **Styling Architecture:** Vanilla CSS via `src/app/globals.css`. No Tailwind CSS or CSS Modules are installed or configured.
- **Configuration Files:**
  - `next.config.mjs`: Only specifies `reactStrictMode: true`.
  - `tsconfig.json`: Targets `es5`, module resolution `bundler`, strict mode enabled, path alias `@/* -> ./src/*`.
  - `docker-compose.yml`: Configures PostgreSQL 16 Alpine (`postgres:16-alpine`) on port 5432.
  - `middleware.ts`: **Missing**. No request middleware, security headers, or rate-limiting guards exist.
- **NPM Audit Result:** `VERIFIED BY TEST` — `npm audit` returned exit code 1 with **3 vulnerabilities** (1 Critical, 2 High):
  - `next` (9.3.4 - 16.3.0-preview.10): Critical (multiple advisories including DoS, SSRF, RCE in Image Optimization API).
  - `postcss` (<= 8.5.22): High (transitive dependency via Next.js; XSS / arbitrary file read in source maps).
  - `source-map-js` (1.0.0 - 1.2.1): High (transitive dependency; DoS via indexed source-map section offsets).

---

## 5. Database Schema and Prisma Audit (Task 5)

### 5a. Existing Models (`prisma/schema.prisma`)
`VERIFIED IN REPOSITORY`: The database schema contains only 3 models:
1. **`Product`**: `id` (CUID PK), `name` (String), `description` (String), `price` (`Float` - PostgreSQL `double precision`), `createdAt` (DateTime).
2. **`Purchase`**: `id` (CUID PK), `email` (String, unindexed), `productId` (String FK -> `Product.id`), `status` (String, default "COMPLETED"), `createdAt` (DateTime).
3. **`License`**: `id` (CUID PK), `email` (String, unindexed), `productId` (String FK -> `Product.id`), `licenseKey` (String `@unique`), `status` (String, default "ACTIVE"), `createdAt` (DateTime), `activatedAt` (DateTime nullable), `activationStatus` (String, default "UNACTIVATED"), `machineId` (String nullable).

### 5b. Migrations vs db push
- Migrations exist in repository under `prisma/migrations/`:
  - `20260819083712_init/migration.sql`: Initial tables, PKs, FKs, and unique index on `licenseKey`.
  - `20260819092554_add_activation/migration.sql`: Added `activationStatus` and `machineId` to `License`.
  - `migration_lock.toml`: Confirms provider is `postgresql`.
- **Indexes:** Only PKs and `License_licenseKey_key` exist. Lookups by customer email are completely unindexed.

### 5c. Seed Data (`prisma/seed.ts`)
Seeds two demo products: `Nav Brahmi — Brahmi Tamil Grantha (2026)` ($39.0) and `Nav Brahmi — Kharoshthi` ($39.0). None of the client's 14 real products are seeded. Currency is undefined / USD.

---

## 6. API Route Handlers Audit (Task 6)

`VERIFIED IN REPOSITORY`: Seven route handlers exist under `src/app/api/`:

| Method | Path | Purpose | Input Validation | Rate Limit | Error Handling & Leaks | Logging | Production Disposition |
|---|---|---|---|---|---|---|---|
| POST | `/api/purchase` | Issues Purchase & License without payment | Manual email regex (`isValidEmail`) | None | 400 for bad email, 404 for missing product, 500 on error | Logs unredacted error to console | **Remove/replace** with Razorpay checkout (F-04) |
| POST | `/api/validate-license` | Validates key; hands out presigned B2 URL (15 min) + checksum | Manual string check | None | 400 for empty key, 401 for invalid key, 500 leaks `error?.message` (F-18) | Logs unredacted error to console | **Rebuild**: Validation must be read-only; download requires activation token (F-06) |
| POST | `/api/license/validate` | Duplicate re-export of `/api/validate-license` | Same as above | None | Same as above | Same as above | **Remove** (redundant alias) |
| POST | `/api/activation` | Binds license to machine; issues Ed25519 token | Manual string check | None | 400 for missing fields, 401 for invalid key, 403 leaks `bound_machine_id` (F-11) | Logs unredacted error to console | **Rebuild** with atomic binding condition and activation limits (F-11) |
| GET | `/api/download-installer` | Serves `Setup.exe` with appended auth payload; also ps1/bat | Reads query params `file`, `token`, `licenseKey` | None | 404 if file missing, 500 on error | Logs unredacted error to console | **Rebuild**: Authorize via signed expiring link; stop passing keys in URLs (F-09, F-17) |
| POST | `/api/license/recover` | Returns all licenses, keys, and download links for an email | Manual email regex (`isValidEmail`) | None | 404 for unknown email vs 200 for known email (user enumeration; F-05) | Logs unredacted error to console | **Replace** with email-link recovery (doc 09); never return keys on screen (F-05) |
| POST | `/api/license/resolve-token` | Exchanges HMAC token for license details including key | Verifies token using hardcoded fallback secret | None | 400 for missing token, 401 for invalid token or inactive license | Logs unredacted error to console | **Remove or rebuild** after token redesign |

---

## 7. Windows Installer and Bootstrapper Audit (Tasks 8, 13c)

### 7a. Technology & Build Architecture
- **Source:** C# WinForms / Console application in `Requirements/windows-driver/bootstrapper/Program.cs` (1,107 lines).
- **Target Runtime:** .NET Framework 4.0 (`C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`).
- **Compilation:** `scripts/build-bootstrapper.ts` compiles with `/target:winexe /platform:anycpu /optimize+ /win32manifest:app.manifest`.
- **Manifest:** `app.manifest:7, 14` sets `requestedExecutionLevel level="asInvoker"` and declares compatibility with Windows 10/11 GUID `{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}`.

### 7b. Security and Flow Facts Re-Verified
- **Unsigned Payload Accepted (F-16):** `Program.cs:200-208` — The payload integrity check `VerifyPayloadSignature` runs **only if** `sig` is not empty. If `signature` is omitted, the bootstrapper accepts the payload as valid.
- **No Token Verification (F-12):** `Program.cs:451-477` — Bootstrapper receives the Ed25519 token from `/api/activation` and writes it to disk. There is **zero code** to verify the cryptographic signature of the token on the client.
- **Architecture Mapping (F-13):** `Program.cs:622-638`:
  - `(arch == "amd64" || arch == "x64" || arch == "arm64")` selects the `amd64` / `x64` MSI (ARM64 mapped to AMD64 without verification).
  - `arch.Contains("86")` selects `i386` / `x86`.
  - `ia64` is never matched.
  - Fallback: `string targetMsi = msiFiles[0];` selects the first MSI found if no architecture matches.
- **Exit Code & False Success (F-14):** `Program.cs:653-668` — Reports success on MSI exit code 0, 3010 (reboot), and **1638 ("already installed")**. No post-install registry or file check is performed.
- **Font Registration Limitation (F-15, D9):** `Program.cs:568-610` strictly scans for `*.ttf`, copying every TTF to system fonts without checking license terms. OpenType fonts (`*.otf`), which exist in delivered packages (e.g. Tamil Grantha), are completely ignored.
- **Temp File Cleanup:** `Program.cs:697-706` — In the `finally` block, `Directory.Delete(tempDir, true)` properly cleans up temporary files on exit.

---

## 8. Discrepancy Log (D1 through D10)

| ID | Topic | Discrepancy Description | Resolution / Status |
|---|---|---|---|
| **D1** | Installer Technology | README documents `setup.ps1` and `setup.bat`, but project brief references a C# `Setup.exe`. | **RESOLVED**: Both exist. `Setup.exe` compiled from `bootstrapper/Program.cs` is the primary executable served by `/api/download-installer`. `setup.ps1` and `setup.bat` are PowerShell/batch alternatives. |
| **D2** | Packages in Repository | README lists driver ZIPs in `Requirements/windows-driver/`, but they are missing from repo. | **RESOLVED**: Driver ZIPs were excluded via `.gitignore:41-43`. However, `Setup.exe` binary IS committed, and `doc.txt` containing Backblaze credentials IS committed and unignored. |
| **D3** | Kharoshthi Product | Kharoshthi appears in seed, `b2.ts`, README, and manifest. | **RESOLVED**: Confirmed absent from agreement (§02) and absent from client delivery `Software/`. Verified as prototype demo data only. |
| **D4** | Supported Windows OS | Manifest (`app.manifest:14`) supports Windows 10 & 11; README claims Windows 11 only. | **CONFIRMED OPEN**: Requires client input (C-06) on supported Windows versions. |
| **D5** | Undocumented Routes | README documents `/api/validate-license`, `/api/activation`, and `/api/download-installer`. | **CONFIRMED**: README omits `/api/purchase`, `/api/license/recover`, and `/api/license/resolve-token`. |
| **D6** | Installer HMAC Secret | HMAC signature exists in server and installer. | **RESOLVED**: The secret is hard-coded in both (`Program.cs:40`, `license.ts:30`), and installer skips verification if signature is absent (`Program.cs:200`). |
| **D7** | Prototype Vercel URL | Prototype Vercel URL is hard-coded as default in server and client. | **CONFIRMED**: Found hard-coded across 6 files (F-19); hosting decision remains open (C-15). |
| **D8** | Website Pages | Agreement specifies 7 page groups (PG-01 to PG-08); prototype has only 3 pages. | **CONFIRMED**: Only `/`, `/purchase/success`, and `/recover` exist. All agreement content pages are missing. |
| **D9** | **Font Formats** | Delivered packages contain OpenType (`.otf`) fonts (e.g. Tamil Grantha), but installer code ignores them. | **NEW DISCREPANCY**: `Program.cs:568` and `setup.ps1:288` strictly filter `*.ttf`, ignoring `.otf` fonts completely. Added to C-39. |
| **D10** | **Pricing & Currency** | Three conflicting prices exist across code, manuals, and invoice template. | **NEW DISCREPANCY**: Code implements `Float` `39.0` (USD in logs); manuals state ₹480 incl. taxes; invoice template calculates ₹472 (₹400 + 18% GST). Blocked on C-02. |

---

## 9. Verified Functionality vs Earlier Claims

| Capability | Audit Result | Evidence (File & Line) |
|---|---|---|
| **CSPRNG License Key Generation** | `VERIFIED IN REPOSITORY` | `src/lib/license.ts:18-25` (`crypto.randomBytes(2)`, 64 bits entropy; F-10) |
| **Server-Side License Validation** | `VERIFIED IN REPOSITORY` | `src/app/api/validate-license/route.ts:28-44` (unprotected from scraping; F-06) |
| **Machine-Bound Activation** | `VERIFIED IN REPOSITORY` | `src/app/api/activation/route.ts:63-96` (one machine, no reset, race condition: F-11) |
| **Ed25519-Signed Activation Token** | `VERIFIED IN REPOSITORY` | `src/lib/keys.ts:68-80` (signing operates, but uses leaked private key: F-01) |
| **Offline Token Verification by Client** | `CONTRADICTED / NOT EVIDENCED` | `Requirements/windows-driver/bootstrapper/Program.cs:451-477` (saves token, zero verification code; F-12) |
| **Presigned 15-Minute B2 URLs** | `VERIFIED IN REPOSITORY` | `src/lib/b2.ts:173-228` (S3 client presigner `getSignedUrl`) |
| **SHA-256 Checksum Verification** | `VERIFIED IN REPOSITORY` | `Requirements/windows-driver/bootstrapper/Program.cs:548-560`; `setup.ps1:270-285` |
| **Architecture-Specific MSI Selection** | `PARTIAL` | `Program.cs:622-638` (x64/x86 selected; ARM64 assumed amd64; ia64 omitted; F-13) |
| **Font Installation** | `VERIFIED IN REPOSITORY` | `Program.cs:568-610` (TTF only; F-15) |
| **Temp-File Cleanup** | `VERIFIED IN REPOSITORY` | `Program.cs:697-706` (`finally` deletes `tempDir`) |
| **License Recovery** | `VERIFIED IN REPOSITORY` | `src/app/api/license/recover/route.ts:28-69` (insecure plain recovery; F-05) |
| **Auto License Detection in Installer** | `VERIFIED IN REPOSITORY` | `Program.cs:157-225`; `src/app/api/download-installer/route.ts:44-87` (F-16, F-17) |
| **Payment Gateway, Email, Contact, Invoices, 14 Products, Website Pages** | `NOT IMPLEMENTED` | Completely absent from codebase |
| **Historical Test Reports** | `UNVERIFIED` | No automated test framework or CI logs; tests in `scripts/` require live credentials |

---

## 10. Prioritized Fix List for Phases 2 to 6

### Priority 1: Critical Security & Secrets Isolation (Phase 2)
1. **Rotate Credentials & Remove `doc.txt` (F-03):** Rotate Backblaze key; delete `doc.txt` from tree.
2. **Generate New Cryptographic Keypairs (F-01, F-02):** Generate fresh Ed25519 signing keypair and server-only token secrets; remove all source fallbacks; enforce server startup validation.
3. **Database Schema Refactoring (Doc 04):** Baseline from existing Prisma migrations; migrate price to integer paise (`priceMinor`); create `ProductPackage` (replacing hard-coded `b2.ts`), `Order`, `Payment`, `Activation`, and `AuditEvent` models; add missing indexes on customer email.
4. **Cloudflare R2 Storage Adapter (Doc 08):** Implement private R2 adapter with presigned GET URLs (< 15 min TTL) and server-held SHA-256 checksums from `ProductPackage`.
5. **Rate Limiting & Security Middleware:** Introduce database-backed rate limiting and security headers on all API routes (F-07).

### Priority 2: Brand Identity & Public Website (Phase 3)
1. **Client Brand System:** Implement client-approved palette `#E51055` (primary/accent), `#FFFFFF` (surfaces), `#0066CC` (links only), and provisional text neutral `#231F20` (C-28). Never place blue on red.
2. **Page Architecture (PG-01 to PG-08):** Build responsive pages for Home, language categories, installation instructions, story, FAQ, and contact using client logos and verified content.
3. **Typography & Licensing (C-29):** Verify font redistribution licenses before embedding specimens or packages.

### Priority 3: Razorpay Payment & License Delivery Pipeline (Phase 4)
1. **Decommission Insecure Checkout (F-04):** Replace `/api/purchase` with Razorpay Orders API server-side creation.
2. **Payment Verification:** Implement idempotent webhook handler with `X-Razorpay-Signature` validation, event deduplication, and server-side checkout signature verification (doc 06).
3. **Secure License Delivery (F-09):** Issue license only upon confirmed payment; remove license keys from URLs; send credentials via transactional email outbox.

### Priority 4: Installer Hardening & Machine Activation Rebuild (Phase 5)
1. **Atomic Activation (F-11):** Rebuild `/api/activation` with atomic binding condition (`where: { id, machineId: null }`) and client-confirmed machine limits (C-07).
2. **Decouple Validation from Download (F-06):** Make `/api/validate-license` read-only; require valid activation token for package authorization.
3. **Installer Bootstrapper Hardening (F-12 to F-17):** Implement server-issued proof verification; reject unsigned payloads; add client-side Ed25519 token verification; correct architecture selection matrix; support `.otf` fonts (D9); implement post-install layout verification.
4. **Secure Recovery Flow (F-05):** Replace plaintext recovery with generic-response email magic links (doc 09).

### Priority 5: Communications, Operations & Acceptance (Phase 6)
1. **Contact Form & Business Mailboxes:** Implement contact form relaying to business mailboxes; configure DNS records (SPF, DKIM, DMARC).
2. **Invoice Generation (C-13, C-34):** Implement GST tax invoice delivery as confirmed by client's accountant.
3. **Comprehensive Regression Testing:** Run test suites T-PAY, T-LIC, T-AUTHZ, T-INTEG, and T-INST across clean Windows environments (doc 12).

---

## 11. Decisions and Inputs Required from Client (Doc 14 References)

The following items are officially logged in `docs/production/14-client-inputs-and-open-decisions.md` and require human decisions:

1. **C-01 (Razorpay Account & Keys):** Written confirmation of Razorpay gateway (§02.3), account ownership verification, test/live API keys, and webhook secret.
2. **C-02 (Final Pricing Conflict):** Resolution between client product manuals (₹480 all taxes included) and client invoice template (₹400 + 18% GST = ₹472).
3. **C-03 (Sellable Catalog & Bundles):** Clarification of 13 agreement categories vs 14 delivered products, what "X and Devanagari" includes, and bundle pricing for Kannada/Tulu.
4. **C-05 (Cloudflare R2 Written Approval):** Written client approval to store proprietary keyboard packages on Cloudflare R2 per NDA terms.
5. **C-06 (Windows OS & Architecture Matrix):** Supported Windows versions (Windows 10/11) and confirmation of architecture support (x64, x86, ia64, and whether ARM64 is in scope).
6. **C-07 (Activation & Reset Rules):** Number of machines permitted per license, policy for hardware replacement/re-activation, and administrator approval flow.
7. **C-09 (Protection Boundary Acknowledgement):** Client acknowledgement that technical protection applies to authorized download and installation only (MSKLC layout DLLs have no post-installation licensing hooks).
8. **C-11 / C-12 (Email Provider & Mailboxes):** Selection of transactional email provider, creation of 4 business mailboxes (`navbrahmi@`, `mahesh@`, `naveen@`, `support@`), and sender mailbox designation.
9. **C-13 / C-34 (GST Invoicing & Billing Fields):** Whether system generates automated invoices, invoice numbering sequence, and checkout billing fields (name, mobile, address, state, GSTIN).
10. **C-15 (Production Hosting Platform):** Client confirmation of hosting platform (Vercel vs client-owned server/GoDaddy) per agreement §02.5.
11. **C-19 (Code-Signing Certificate):** Procurement of trusted Authenticode code-signing certificate for `Setup.exe`.
12. **C-29 (Font Redistribution Licences):** Written confirmation of redistribution rights for delivered font files (Noto, Grantham, custom Tigalari, etc.).
13. **C-32 (Credential Hygiene Action):** Client action to change GoDaddy and Gmail passwords (delivered in plaintext) and enable 2FA; rotation of Backblaze B2 key.
14. **C-38 (Remote Git Repository):** Confirmation of official remote Git repository URL and verification that access is restricted to authorized private parties.
15. **C-39 (OpenType .otf Font Support):** Confirmation whether Windows installer should support and register OpenType (`.otf`) fonts in addition to TrueType (`.ttf`).
