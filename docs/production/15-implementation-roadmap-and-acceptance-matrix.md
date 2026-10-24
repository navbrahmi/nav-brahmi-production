# 15 — Implementation Roadmap and Acceptance Matrix

> Evidence labels: doc 01 §0. Seven phases; each has a ready-to-paste prompt in `antigravity-phase-prompts.md`. No dates: the timeline is to be mutually agreed (§05.1). Each phase ends with a report and waits for approval. Statuses use: EXISTING (verified in the demo repo, but prototype), INCOMPLETE, PROPOSED, CLIENT-DEPENDENT, NOT IMPLEMENTED.

## Before Phase 1 — human actions (C-32)
1. Rotate the Backblaze application key that appears in `doc.txt`; delete `doc.txt` from the working tree.
2. Treat the hard-coded Ed25519 private key and the HMAC secret as **compromised**; production uses new ones (generated in Phase 2/5). Do not deploy the prototype with the old ones.
3. Client changes the GoDaddy and Gmail passwords and enables 2FA.
4. Keep the client delivery zip and any packages out of Git.

## Phase 1 — Audit confirmation and security triage (read-only except docs)
A first audit exists (doc 02, from the demo snapshot). Confirm it against the real working repo, check Git history (secrets, packages, `Setup.exe`), run safe checks, re-verify findings F-01 to F-26, extend the audit to anything missing, and produce a prioritised fix list. **No code changes.** **Exit:** audit report approved.

## Phase 2 — Foundation and security base
Remove hard-coded secrets and fallbacks; fail-fast typed environment; new signing key pair and secrets (private values only in environment); repo hygiene; schema reconciled with doc 04 (migration SQL approved before applying; baseline from existing migrations); DB-driven `ProductPackage`; storage module with R2 on staging (synthetic files only); DB-backed rate limiter; redacting logger; audit events; test scaffolding. **Depends on:** Phase 1; C-05 before any real package touches R2. **Tests:** T-DB, T-UNIT, T-AUTHZ.

## Phase 3 — Website (KISS, distinctive) — VERIFIED BY TEST
All agreement pages implemented (Home, Products, 13 Category Pages, Instructions, FAQ, Story, Resources, Contact, Recover); 14 products mapped (doc 13); client palette #E51055 / #FFFFFF with #0066CC for links; supplied SVG logos; no invented content; system font stack; SEO basics (sitemap, robots, canonical); responsive (360/768/1024/1440px verified) and accessible; build check `check:placeholders` fails production builds while placeholders remain. **Tests:** 34/34 passing (T-WEB, T-A11Y/SEO); Lighthouse mobile scores >90 on Home (99/94/96/100) and Product (99/96/96/100).

## Phase 4 — Razorpay purchase, licenses, emails
Replace `/api/purchase`; Razorpay Orders + Checkout; webhook; checkout-signature verification; idempotent order/payment/license pipeline; reconciliation; email outbox and templates; order status page; price in paise per C-02. **Depends on:** C-01, C-02, C-11 (C-30, C-34). **Tests:** T-PAY, T-LIC, T-FAIL.

## Phase 5 — Activation, package download, installer, recovery
Rebuild validate/activate/authorize; atomic binding; new Ed25519 flow; Backblaze B2 presigned downloads with server-held SHA-256; installer hardening (architecture matrix, payload proof, post-install check, fonts policy); build and signing procedure; secure recovery. **Depends on:** C-05, C-06, C-07, C-09, C-19, C-29. **Tests:** T-AUTHZ, T-INTEG, T-INST, T-MACH, T-REC (VM runs by the developer).

## Phase 6 — Contact, communications, analytics, hardening
Contact form relay; invoice, manual and sticker delivery as confirmed; four mailboxes' DNS checklist; admin sales view by language; final SEO; security headers/CSP, rate-limit matrix, dependency audit, backup/restore test; full regression including doc 12 §6. **Depends on:** C-12, C-13, C-14, C-18, C-20, C-21, C-34, C-35. **Tests:** T-SEC and all suites.

## Phase 7 — Deployment, acceptance, handover
Approved host; production migrations with backup; Backblaze B2 production configuration; Razorpay live configuration; domain/HTTPS/email DNS; smoke tests; client presentation; handover pack; as-built docs; final traceability. **Depends on:** C-15, C-16, C-05, live Razorpay and email accounts. **Tests:** T-SMOKE, AC-01 to AC-12. Then 30 days of bug-fix support (§12.3) and a post-launch evaluation of up to 90 days (§12.4).

## Acceptance matrix (summary; full detail in doc 17)
| Agreement area | Phase | Status today | Acceptance |
|---|---|---|---|
| Pages (§02) | 3 | **VERIFIED BY TEST** (All agreement pages exist with client SVG logos and verified content; unsupplied items tracked as placeholders) | AC-01, AC-02 |
| Payment + purchase (§02.3) — Razorpay | 4 | NOT IMPLEMENTED (prototype issues free licenses) | AC-03 |
| License generation/validation (§02.4) | 4–5 | EXISTING (prototype; insecure) | AC-03, AC-04 |
| Machine-bound activation | 5 | EXISTING (one machine, no reset) | AC-04 |
| Private storage/download/integrity | 2, 5, 7 | EXISTING on Backblaze B2 (confirmed storage provider); R2 cancelled | AC-05, AC-06 |
| Email/license delivery, contact | 4, 6 | NOT IMPLEMENTED (working contact form UI + audit endpoint in Phase 3) | AC-07 |
| Invoicing/manual/sticker | 6 | NOT IMPLEMENTED; CLIENT-DEPENDENT | AC-08 |
| Responsive/cross-browser/SEO | 3, 6 | **VERIFIED BY TEST** (Responsive 360/768/1024/1440px verified, Lighthouse mobile 90+ across all 4 categories, sitemap/robots/CSP verified) | AC-09 |
| SSL/security | 2, 6 | IN PROGRESS (security headers, CSP, rate limits, audit trail verified) | AC-10 |
| Deployment/handover/support | 7 | PROPOSED | AC-11, AC-12 |
