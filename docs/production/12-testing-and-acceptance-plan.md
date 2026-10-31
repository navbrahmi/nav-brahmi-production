# 12 — Testing and Acceptance Plan

> Evidence labels: doc 01 §0. Historical prototype test reports are DEVELOPER-REPORTED and do not count as acceptance evidence. The demo repo has ten test-style scripts and no test framework; three of them hit the live prototype URL (VERIFIED IN REPOSITORY). They are inputs for new tests, not evidence. Backend and installer tests use automated tests and direct API calls — **no DOM/browser automation** for backend or installer. Browser testing is used only for website UI/responsive checks.

## 1. Test levels
| ID | Area | Method | Covers |
|---|---|---|---|
| T-UNIT | License generation/format, token sign/verify, machine-ID hashing, state machine, validators | unit tests | FT-08, FT-09, FT-11 |
| T-API | Every route in doc 05: valid/invalid input, auth, status codes, error format | integration (HTTP) | FT-09, FT-10 |
| T-DB | Constraints, uniqueness, transactions, migrations apply on clean DB, rollback of failed txn | DB tests | FT-08 |
| T-PAY | Razorpay test mode: success, failure, abandoned, amount mismatch, duplicate webhook, bad signature, delayed/out-of-order webhook, bad checkout signature | Razorpay test mode + locally signed fixtures | FT-05–07 |
| T-LIC | Issue → validate → activate → same machine retry → second machine → revoked → refunded | API | FT-08–11 |
| T-MACH | Different physical/VM Windows machines; cloned VM; OS reinstall; hardware change policy | manual + scripted | FT-11 |
| T-INST | Installer on each supported Windows version/arch (clean VMs): success path, network loss, hash mismatch, expired URL, cancel, insufficient rights, re-run | scripted VM runs | FT-10, FT-12–15 |
| T-INTEG | Tampered package (bit-flip), wrong product package, truncated download | scripted | FT-15 |
| T-AUTHZ | Unauthorized download: no token, other product's token, expired token, direct bucket URL, listing attempt | API/curl | FT-13, FT-14 |
| T-REC | Recovery: generic responses, rate limit, single-use link, expiry, wrong email | API | recovery |
| T-FAIL | Paid-but-no-license, email failure, R2/DB outage, activation retries | fault injection | doc 06 §6 |
| T-WEB | Cross-browser (current Chrome, Edge, Firefox, Safari), responsive (desktop/laptop/tablet/phone), links, forms | manual + visual | FT-01, FT-22 |
| T-A11Y/SEO | Basic accessibility (keyboard, contrast, labels), titles/meta/sitemap/robots/OG, Lighthouse | tools | FT-21 |
| T-SEC | `npm audit`, secret scan, header check, TLS check, rate-limit check | tools | FT-23 |
| T-SMOKE | Post-deploy: home loads, one test purchase (sandbox) → email → activation → install | scripted | FT-25 |

## 2. Data and environments
Staging with sandbox payment keys, staging bucket, test emails, **synthetic or client-authorized packages only**. Do not store hashes/paths of real packages in public reports; evidence logs are shared with the client privately.

## 3. Evidence
For each test: ID, date, build/commit, environment, Windows build + architecture, result, log file. Stored in a private location (not the public repo). Only evidence-backed items change a requirement status in doc 17.

## 4. Agreement-aligned acceptance criteria
| ID | Criterion |
|---|---|
| AC-01 | All 7 page groups (§02) present with client-approved content or approved placeholders. |
| AC-02 | Every agreement category has a page, and each of the 14 delivered products maps to a confirmed product/package/price (doc 13). |
| AC-03 | A sandbox purchase results in exactly one license, even with duplicate webhooks. |
| AC-04 | A license activates on an authorized machine and is refused according to the approved rules elsewhere. |
| AC-05 | Packages cannot be downloaded without backend authorization; URLs expire. |
| AC-06 | Tampered package is rejected; no false success. |
| AC-07 | Customer receives confirmation and license emails; contact form reaches the business mailbox. |
| AC-08 | Invoice/manual/sticker delivery works as confirmed by the client. |
| AC-09 | Responsive and cross-browser checks pass on the agreed browser list. |
| AC-10 | HTTPS enforced; secrets absent from repo/bundle; **all critical and high findings F-01 to F-09 closed with evidence**; no critical audit findings. |
| AC-11 | Handover items delivered (doc 16). |
| AC-12 | Client reports issues within 7 days of presentation (§12.1); in-scope defects fixed. |

## 5. Exit criteria
No open critical/high defects; all must-pass tests (T-PAY, T-LIC, T-AUTHZ, T-INTEG, T-INST on confirmed matrix) green with evidence.

## 6. Regression tests required by the audit (doc 02 §8)
| Finding | Test |
|---|---|
| F-01/F-02 | Build output and repo contain no private key or fallback secret; server refuses to start without keys; forged token/payload is rejected |
| F-04 | No route issues a license without a verified Razorpay payment (legacy unpaid /api/purchase removed; verified by test in checkout-api.test.ts) |
| F-05 | Recovery gives identical responses for known/unknown emails and returns no license data |
| F-06 | Package authorization without a valid activation token fails |
| F-08 | Unknown product or architecture returns an error (never another product) |
| F-11 | Concurrent first activations bind exactly one machine; 403 reveals no identifiers |
| F-13 | x64, x86 select the correct MSI; unsupported architectures stop with a message |
| F-14 | Success is reported only after the post-install check |
| F-17 | Signature/SmartScreen behavior of the downloaded Setup.exe is recorded |

## 7. Phase 4 Automated Test Execution Results (VERIFIED BY TEST)

Executed via `npm test` on 2026-10-24 against local PostgreSQL scratch database:
- **Suites:** 22 total (10 new Phase 4 suites + 12 baseline suites)
- **Tests:** 70 passed, 0 failed, 0 skipped
- **Duration:** ~2.4 seconds
- **Suites Executed:**
  1. `tests/unit/order-state.test.ts` (6/6 tests passed)
  2. `tests/unit/razorpay-signatures.test.ts` (6/6 tests passed)
  3. `tests/unit/payment-completion-unit.test.ts` (4/4 tests passed)
  4. `tests/integration/checkout-api.test.ts` (3/3 tests passed)
  5. `tests/integration/webhook-api.test.ts` (5/5 tests passed)
  6. `tests/integration/concurrency-webhook.test.ts` (1/1 concurrency stress test passed: 10 parallel webhooks -> 1 license)
  7. `tests/integration/failure-reconciliation.test.ts` (1/1 failure injection & reconciliation recovery test passed)
  8. `tests/integration/email-outbox.test.ts` (3/3 outbox dispatch, backoff, and state advancement tests passed)
  9. `tests/integration/order-status-api.test.ts` (3/3 status, masked email, and token lookup tests passed)
  10. `tests/integration/cron-protection.test.ts` (4/4 CRON_SECRET authorization tests passed)
  11. Existing suites: audit, contact, rate-limiter, placeholder-check, content-loader, env, keys, license, link-checker, logger, storage (B2 confirmed), theme-tokens (34/34 passed).

## 8. Phase 5 Automated Test Execution Results (VERIFIED BY TEST)

Executed via `npm test` on 2026-10-24 against local PostgreSQL scratch database:
- **Suites:** 28 total suites
- **Tests:** 107 passed, 0 failed, 0 skipped (100% pass rate)
- **Duration:** ~9.8 seconds
- **Phase 5 Suites Executed:**
  1. `tests/integration/activation-api.test.ts` (7/7 tests passed: atomic bind, concurrency stress test with 10 competing machines, idempotent re-activation, rate-limiting, error reporting without machine ID leakage)
  2. `tests/integration/package-authorization.test.ts` (6/6 tests passed: valid token auth, expired token rejection, tampered signature rejection, machine ID mismatch rejection, C-06 architecture enforcement for x64/x86, presigned B2 URL capped at 900s)
  3. `tests/integration/storage-integrity-b2.test.ts` (5/5 tests passed: live Backblaze B2 upload of synthetic package, 100% byte stream & SHA-256 match, expired URL rejection, tampered checksum rejection, public listing 403 AccessDenied verification)
  4. `tests/integration/license-recovery.test.ts` (4/4 tests passed: anti-enumeration identical response for known/unknown emails, single-use token redemption, zero raw or masked keys returned in API response, transactional outbox queueing, preservation of existing machine activation bindings)
  5. `tests/unit/license-crypto.test.ts` (6/6 tests passed: authenticated AES-256-GCM encryption/decryption, ciphertext tampering detection, auth tag tampering detection, legacy record fallback, stable 32-byte key resolution)
  6. `tests/unit/installer-bootstrapper.test.ts` (6/6 tests passed: native architecture detection rejecting unsupported platforms, HTTPS remote URL security enforcement, PE Authenticode overlay append analysis confirming signature invalidation, C-29 font whitelist enforcement, MSI exit code 1638 registry verification, local Ed25519 token claims validation)

## 9. Windows Manual Hardware Verification (DEFERRED)
- Detailed 12-scenario checklist established in `docs/production/test-evidence/windows-test-checklist.md`.
- All Windows runtime checks are marked **PENDING MANUAL WINDOWS VERIFICATION**. No Windows build or runtime outcomes are fabricated in Ubuntu.

## 10. Phase 6 Automated Test Execution Results (VERIFIED BY TEST)

Executed via `npm test` on 2026-10-31 against local PostgreSQL scratch database:
- **Suites:** 34 total suites (6 new Phase 6 suites + 28 regression suites)
- **Tests:** 146 passed, 0 failed, 0 skipped (100% pass rate)
- **Duration:** ~10.8 seconds
- **Phase 6 Suites Executed:**
  1. `tests/unit/csp-header.test.ts` (6/6 tests passed: verifies Content-Security-Policy header rules across environments; strictly omits `'unsafe-eval'` in production, Vercel Preview, and Vercel Production; conditionally permits `'unsafe-eval'` strictly in local development for React callstack reconstruction; preserves all required Razorpay payment gateway integration sources and clickjacking defenses).
  2. `tests/unit/skeleton-loader.test.ts` (7/7 tests passed: verifies skeleton loader components, shimmer CSS classes, accessibility attributes `role="status"` and `aria-busy="true"`, `@media (prefers-reduced-motion: reduce)` tokens, domain skeletons for product lists, product details, order status, and checkout, and distinct error/empty/loading states).
  3. `tests/unit/pricing-and-catalog.test.ts` (4/4 tests passed: verifies confirmed retail price ₹472.00 represented consistently as 47200 paise, absence of automated 18% GST surcharge, distinct products for Kannada and Tulu, and withholding of unconfirmed Tamil/Grantha bundling with checkout disabled and `priceMinor: null`).
  4. `tests/unit/font-manifest.test.ts` (6/6 tests passed: verifies product-specific font mapping, rejection of cross-language font mixing, strict rejection of wildcards and unapproved fonts, persistent Win32 registry and `AddFontResourceW` registration without `FR_PRIVATE`, and uninstall cleanup).
  5. `tests/integration/admin-reset.test.ts` (6/6 tests passed: verifies one-machine binding rule, same-machine idempotent activation, different-machine rejection, support-assisted reset with verified ticket and reason, 90-day cooldown enforcement, exceptional administrator override, invalidation of previous bindings to `REVOKED`, invalidation of old activation tokens for package downloads, and audit event creation).
  6. `tests/integration/refund-request.test.ts` (6/6 tests passed: verifies 7-calendar-day refund request calculation from server-recorded `installedAt`, fallback to manual review when `installedAt` is missing, duplicate request blocking with `DUPLICATE_REQUEST_PENDING`, fixed-window rate limiting, `PENDING_REVIEW` database status, Resend email outbox notification queueing, and zero automatic refund or license revocation).
- **Static Analysis & Linting:**
  - `npm run typecheck`: 0 TypeScript errors across the entire codebase.
  - `npm run lint`: 0 ESLint errors and 0 warnings.
- **Supabase Migration Status:**
  - `npx prisma migrate status`: Database schema is up to date (6/6 migrations applied, 0 pending).
  - Clean scratch database migration replay verified with 0 schema difference across all 6 migrations.
- **Supabase Product Data Reconciliation Verification:**
  - 14 products in Supabase:
    - 12 active confirmed individual products verified at ₹472.00 (47200 paise), currency `INR`.
    - Kannada (`KANNADA`) and Tulu (`TULU`) verified as independent standalone records.
    - Legacy combined product (`KANNADA_TULU_LEGACY`) verified with `isActive = false`, `priceMinor = null`, 0 packages, blocked from purchase.
    - Tamil & Tamil Grantha (`TAMIL_AND_GRANTHA`) verified with `price = 0`, `priceMinor = null`, checkout withheld.
  - 24 registered packages in `ProductPackage` and Backblaze B2 across all 12 purchasable products (x64 and x86), verified with 100% byte size and SHA-256 match.
- **Supabase RLS & Least-Privilege Verification:**
  - Row Level Security verified active on all 15 public tables (`rowsecurity = true`).
  - `role_table_grants` verified: exactly 0 grants to `anon` and `authenticated` roles.
  - Server-side Prisma operations verified passing with 100% functionality.





