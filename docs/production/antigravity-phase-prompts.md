# Antigravity Phase Prompts — NAV BRAHMI

Paste **one prompt at a time**, in order. Each prompt already contains the standing rules, so it works even if Antigravity has lost earlier context. After each phase, read the report, answer its questions, say "APPROVED" (or give corrections), then paste the next prompt.

Put the `docs/production/` folder (all 17 docs plus this file) in the repository before starting.

## Do these yourself BEFORE pasting Phase 1 (security)
1. Rotate the Backblaze application key that appears in `doc.txt` (repo root) and delete that file from your working copy.
2. Treat the hard-coded Ed25519 private key and the HMAC secret in the prototype as compromised. Do not deploy the prototype with them; new ones are created in Phase 2.
3. Ask the client to change the GoDaddy and Gmail passwords and enable 2FA: they were delivered in plain text.
4. Keep the client delivery zip and any driver packages out of Git. Never paste secret values into chats.

## What you (the developer) must supply along the way
| When | What |
|---|---|
| Phase 1 | Repo access for Antigravity; whether the GitHub repo is private or public |
| Phase 2 | Written client approval to store the NDA packages on Cloudflare R2 (before any real package is uploaded); Cloudflare staging account/tokens in local env |
| Phase 3 | Brahmi story text, FAQ, screenshots/videos, specimen text, font licence decisions (placeholders until then); the client's logos from the delivery zip |
| Phase 4 | Razorpay test keys + webhook secret in local env; the final price (client manuals say 480 INR incl. taxes, the invoice template computes 472; C-02); email provider decision; billing-field decision (C-34) |
| Phase 5 | Answers to C-06 (ship x64/x86/ia64? ARM64? minimum Windows), C-07 (activation rules), C-09 (client acknowledges installer-only protection), C-19 (code-signing certificate), C-29 (font licences); real packages placed by you locally; Windows VMs for installer tests |
| Phase 6 | Answers to C-12 to C-14 and C-34/C-35 (mailboxes, invoicing, manual/sticker/WhatsApp, billing fields), C-18 (retention/policy pages), C-20/C-21 (analytics access) |
| Phase 7 | Hosting and domain access (C-15, C-16), Razorpay live keys (client's verified account), live email provider |

Environment variable **values** are never pasted into chats or files; set them locally or in the host's secret store.

---

## PHASE 1 — Audit and baseline (read-only except docs)

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 1 — AUDIT CONFIRMATION AND SECURITY TRIAGE
Goal: confirm, correct and extend docs/production/02, which was written from a demo snapshot without Git history. Read docs/production/01 to 17 completely first. Re-verify every finding F-01 to F-26 against the real working repository and report CONFIRMED / NOT REPRODUCED / CHANGED for each, with file paths and line numbers (never secret values).

HARD CONSTRAINTS FOR THIS PHASE
- NO application code changes. Only markdown files in docs/production/ may be edited, plus one new file docs/production/audit-report-phase1.md.
- Do not run anything that touches production (production database, production storage, live payments, scripts that upload or sync packages). If a script might, read it but do not run it, and list it.
- Do not print file contents of driver packages, keys or .env files. Report file names, never values, hashes or contents.

TASKS
1. Inventory the repository: tree, branches, remotes, number of commits, last commit date, and git ls-files summary.
2. Confidentiality check (risk R1): list every tracked file and every file ever committed (git log --all --diff-filter=A --name-only) that looks like a driver package, installer, archive, MSI, key, certificate or .env file. Report names and the commit where each was added, nothing else. Check .gitignore. Tell me whether the remote appears public or private if you can tell; otherwise ask me.
3. Secrets scan: search source and git history for hard-coded credentials, tokens, private keys and connection strings (use a scanner only if already installed; otherwise pattern search). Report file:line, never the value.
4. Stack audit: package.json (scripts, dependency versions), lockfile, next.config, middleware, tsconfig, lint/test configuration, CI files, vercel.json or any host config, styling approach (Tailwind, CSS modules, etc.). Run npm audit (read-only) and summarise.
5. Prisma audit: every model, field, relation, index and constraint; whether migrations exist or db push was used; seed.ts contents (product names/prices present in the seed are to be listed, not trusted). Fill docs/production/04 section 2 and mark which proposed entities already exist.
6. API audit: list every route handler (method, path, purpose, authentication, input validation, rate limiting, error handling, logging of sensitive data). Fill docs/production/05 section 1.
7. Library audit (src/lib): B2 access, license key generation (is it a CSPRNG?), key format, how keys are stored, token claims and expiry, Ed25519 signing and verification, machine-ID derivation, recovery logic, anything that reads environment variables.
8. Installer audit: find the installer source. Resolve discrepancy D1 (README lists setup.ps1/setup.bat; the project brief says a C# Setup.exe that selects an MSI). Report: technology, how it is built, how the backend URL is embedded, where any HMAC key lives, how architecture and Windows version are detected, error handling, whether it can print success after failure, temp-file cleanup, supported OS/architecture as coded.
9. Environment variables: list every process.env name used in src and scripts (names only) and fill docs/production/11 section 1 with confirmed names. Mark which are public vs server.
10. Scripts: summarise what each script in scripts/ does and whether it touches production resources.
11. Tests: list existing tests and test scripts; run only those that are safe and offline; save the real output; list the ones that need credentials and were not run.
12. UI audit: list existing pages/routes/components versus the agreement pages (PG-01 to PG-08 in doc 17). Note what is real, what is placeholder.
13. Product data audit: which products/packages does the code or seed reference? Do not expose package contents or hashes. Compare against docs/production/13 (14 delivered products) and note that Kharoshthi and the seeded prices are demo data.
13b. Git history (not available in the snapshot): check whether secrets, doc.txt, Setup.exe, driver packages or the client delivery were ever committed (names and commit ids only). Check whether the remote is public.
13c. Verify the installer facts in docs/production/07 section 1 and doc 02 section 6, especially: unsigned payload accepted, no token verification, architecture mapping (ARM64 to amd64, ia64 never chosen, fallback to first MSI), success on msiexec code 1638, payload appended after signing.
14. Agreement mapping: update every status in docs/production/17 with the evidence you found (file path or test output). Anything you cannot verify stays NOT EVIDENCED or UNVERIFIED.
15. Update docs/production/02 so that every README-STATED or DEVELOPER-REPORTED line you checked becomes VERIFIED IN REPOSITORY, VERIFIED BY TEST, or is marked as contradicted.

DELIVERABLES
- Updated docs 02, 04, 05, 11, 13 (only facts), 17, with each F-xx finding marked CONFIRMED / NOT REPRODUCED / CHANGED.
- docs/production/audit-report-phase1.md with: executive summary, R1 outcome, secrets findings, discrepancy table (D1 to D8 resolved/updated, new ones added), verified vs unverified table, a list of existing functionality that works per evidence, a prioritized fix list for Phases 2 to 6, and the exact questions I must ask the client.

EXIT CRITERIA
Every claim in the audit report has a file path or command output behind it. No code was changed. Then give the REPORT and STOP.
```

---

## PHASE 2 — Foundation

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 2 — FOUNDATION
Prerequisite: Phase 1 report approved by me. Re-read docs/production/02, 03, 04, 08, 10, 11 and audit-report-phase1.md.

Goal: a safe base to build on: configuration, schema, storage, rate limiting, logging, audit trail and test scaffolding.

HARD CONSTRAINTS
- Local and staging only. Never touch the production database or production storage.
- Do not upload any real client package to R2. Storage tests use synthetic random-byte files generated at test time (not committed).
- Do not delete B2 code or objects. Do not change existing routes' behaviour in this phase except where listed.
- Do not rewrite Git history. If Phase 1 found packages or secrets in history, only prepare a written purge plan.

TASKS
0. Remove known-compromised material, in this order, showing me each diff first: (a) delete doc.txt from the working tree (history purge only with my explicit approval); (b) remove the hard-coded Ed25519 private key fallback and the hard-coded HMAC/token secret fallbacks from src/lib and the scripts so the app fails to start when they are missing; (c) add a key-generation script that creates a NEW Ed25519 pair and prints only the PUBLIC key (I set the private key in the environment myself); (d) remove the hard-coded prototype Vercel URL fallbacks in favour of APP_BASE_URL; (e) remove DEMO_MACHINE_ID from production paths. The installer is changed in Phase 5; do not rebuild Setup.exe now.
1. Repo hygiene, only the items I approved after Phase 1: extend .gitignore (env files, keys, archives, installers, msi, the client delivery), add .env.example with variable NAMES only, add a simple secret/binary pre-commit check. If packages are tracked and I approved, remove them from tracking with git rm --cached (files stay on disk) and document where the authorized copies must live. Do not purge history.
2. Environment module: typed, validated at startup (use the validation library already in the repo or zod if none; justify), server-only (import server-only), fail fast with a message that lists missing NAMES but never values. Separate public from server variables. Add a test that no server variable is referenced from client components.
3. Schema: reconcile prisma/schema.prisma with docs/production/04. The existing schema has Product, Purchase and License only (price is Float, no indexes, one machineId on License). Baseline production from the existing two migrations, then add changes. Money becomes integer paise. Reuse existing models and fields wherever they exist; Purchase is replaced by Order; Activation replaces License.machineId; ProductPackage replaces the package definitions hard-coded in src/lib/b2.ts. Add only what the agreement flows need: ProductPackage, ProductAsset (manual/sticker), Order, Payment (provider Razorpay, providerOrderId, providerPaymentId, unique event id), License changes, Activation, AuditEvent, a rate-limit table, an email outbox table, and a recovery-token table. Do not add an Invoice table or billing columns until C-13/C-34 are answered. CHECKPOINT: show me the schema diff and the generated migration SQL, then WAIT for my "APPROVED" before applying it to any database. If the prototype used db push, propose a baseline migration and wait.
4. Storage module (src/lib/storage or the existing location; today it is src/lib/b2.ts): functions getPresignedGetUrl(objectKey, ttlSeconds), headObject(objectKey), and an upload helper used only by admin scripts. Package lookup comes from the database, never from definitions in source, and an unknown product or architecture must raise an error (today it silently returns the Tamil Grantha package). Implement R2 through its S3-compatible API (check current Cloudflare docs for endpoint format, region setting, and presigned URL limitations). Keep the existing B2 implementation reachable via STORAGE_PROVIDER (b2 or r2); default stays as it is today until the Phase 7 cutover. Credentials server-only. TTL configurable, maximum 15 minutes. Never log URLs.
5. Scripts: add (do not replace) R2 versions of the upload and sync scripts. Dry-run by default, never delete objects, print object keys and sizes only, verify SHA-256 after upload, never print credentials.
6. Rate limiter: a small DB-backed fixed-window limiter (avoids adding a new vendor) wrapped as a helper for route handlers, keyed by IP and by a caller-supplied key. If you believe this is unsuitable for serverless latency, propose alternatives and wait for me.
7. Logger: structured, with a request id and automatic redaction of license keys, tokens, signatures, presigned URLs, authorization headers, and masked emails.
8. Audit-event helper: writes AuditEvent rows containing no secrets.
9. Shared helpers: error response format and status codes from docs/production/05 section 2; input validation helper.
10. Test scaffolding using the framework already in the repo (ask me before adding one): unit tests, API integration tests against a local or test database (check whether Docker or Supabase local is available; if not, ask me how to provide a test database).
11. Staging R2 verification with synthetic files: presigned GET works before expiry and fails after; unsigned GET fails; a runtime-scoped token cannot list or write; wrong key returns not found.
12. CI: if the repo already has CI, add lint, typecheck and tests; otherwise ask me.

DOCS TO UPDATE: 03, 04, 08, 11, 17 (evidence-based statuses only).

EXIT CRITERIA
Lint, typecheck and all tests pass (real output in report). Migration approved and applied only to local/staging. No secrets in diffs (show the scan output). Then REPORT and STOP.
```

---

## PHASE 3 — Website (KISS and distinctive)

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 3 — WEBSITE
Prerequisite: Phase 2 approved. Re-read docs/production/01 section 10, 03 section 8, 13, 14 and the agreement page list in doc 17 (PG-01 to PG-08, FT-01 to FT-04, FT-16, FT-21, FT-22).

Goal: the complete agreed website, simple and distinctive, built with the client's final palette and placeholder content that can be replaced when the client delivers the remaining material.

HARD CONSTRAINTS
- Only the pages in the agreement. Do NOT add a blog, cart, account area, search, newsletter, chat widget, cookie banner, analytics tracker, carousel or animation library.
- No invented content: no product claims, prices, testimonials, history text, mission text, contact details, screenshots or videos. Everything not supplied is a clearly marked PLACEHOLDER.
- No dummy products or prices. Prices come only from the database. Do not reuse the prototype's demo products (Brahmi Tamil Grantha / Kharoshthi at 39.0) or its maroon palette. If no price exists, the buy button is hidden and the page says the price is pending (in non-production) .
- Do not add legal pages (privacy, terms, refund) yet. They are not in the agreement; record the question in doc 14 (C-18) and tell me whether Razorpay's current documentation requires them for account activation.

DESIGN BRIEF
- KISS: server-rendered pages, plain semantic HTML and CSS following the styling approach the repo already uses (decide from the Phase 1 audit; if unclear, ask me). Client-side JavaScript only where required (checkout button, installer download, forms).
- Distinctive (PROPOSED concept, needs client approval, must be easy to swap): script-first. The client's logo is a 3x3 grid of monitors, each showing a script letter in red; use that grid as the home-page motif (use the client's SVG logos from the delivery as supplied; do not redraw them). Each language page opens with a very large specimen of its script, one reading column, typography doing the visual work, red accent on white, generous whitespace, a header with at most six links. Tagline: two exist in the client's materials; show neither until C-33 is answered.
- Theme tokens: ALL colours, font families, sizes and spacing live in one theme file as CSS variables. Brand values are FINAL per the client: --brand #E51055, --surface #FFFFFF, --link #0066CC. No other brand colours; derive hover/focus states only by opacity or underline, not new hues. Body text uses the PROVISIONAL token #231F20 (from the client's logo), flagged for confirmation. Check contrast in the build (white on #E51055 is 4.63:1; #0066CC on white is 5.57:1; never put blue on red). Prove the tokens work by changing them in a test run and showing the site restyles.
- Fonts: the client's delivery contains many fonts with unknown licences (doc 13 section 4). Do not self-host, commit or serve any of them until I confirm its licence. Noto families are open-licensed; verify each file's licence text before use. Until then use a system font stack and placeholder specimens, and report which script/font combinations you would need. Verify that each script renders without missing-glyph boxes once specimen text is supplied; until then specimens are placeholders.
- Language: UI in English unless I say otherwise (C-31).
- Accessibility: semantic headings, labels, focus styles, keyboard use, alt text, reduced-motion respect, verify contrast for the client palette (see theme token rules).
- Responsive: mobile first; verify 360, 768, 1024 and 1440 pixel widths and list Safari iPhone/iPad checks for me to run manually.
- Performance: target Lighthouse mobile 90+ for performance, accessibility, best practices and SEO on the home page and one product page; report the real numbers.

ROUTES (names configurable; derived from the agreement)
- Home: About NAV BRAHMI, Vision and Mission, overview of work and products.
- Products list built from docs/production/13: the 13 agreement categories mapped to the 14 delivered products. Do not decide bundles or what 'and Devanagari' includes (C-03): show the mapping table as data and ask me. Display spellings are PROPOSED; the client must approve.
- One page per category: language-specific information, features/specifications (placeholder), screenshots/graphics/videos/font links (placeholder), and a purchase entry. The purchase flow itself is built in Phase 4; create the page structure and a disabled button.
- Download and installation instructions page (content must match the real installer behaviour from Phase 1/5; placeholder until then).
- FAQ/Help page. Story page: how Brahmi became user-friendly (client text; placeholder). Contact information page (details from client; the form handler is Phase 6).
- Recovery page: keep the existing prototype page, restyle it only. Logic changes are Phase 5.

CONTENT
- Typed content files in a content folder, every unsupplied item marked with the literal word PLACEHOLDER.
- A script check:placeholders that fails the PRODUCTION build if any PLACEHOLDER remains (it must not block local development).

SEO (basic, as in the agreement): unique title and description per page, canonical URLs, sitemap.xml, robots.txt, Open Graph basics, correct html lang and language tags for script specimens (verify the correct BCP-47 tags in a reliable source; do not guess).

SECURITY BASELINE: security headers in the Next.js config; leave the Razorpay Checkout script domain out until Phase 4.

TESTS: content-loader unit tests; link checker; placeholder check script test; Lighthouse run; responsive screenshots at the four widths (browser tools are allowed here, for UI only); token-swap test.

DOCS TO UPDATE: 01 section 10, 03 section 8, 13 (only facts), 15, 17.

EXIT CRITERIA
Every agreement page exists; no invented content; production build fails while placeholders remain and passes when none do (show both runs). Then REPORT and STOP.
```

---

## PHASE 4 — Razorpay purchase, license issuance, emails

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 4 — PURCHASE, LICENSES, EMAILS
Prerequisite: Phase 3 approved. Re-read docs/production/04, 05, 06 (including section 10), 09 section 4, 12, 14.

Before coding, check docs/production/14 and my messages. If any of these is unanswered, STOP and list it: C-01 (Razorpay account and test keys available in local env), C-02 (the final price: the client's manuals say 480 INR including all taxes, the invoice template computes 472; do not pick one), C-30 (purchase model), C-34 (billing fields). The existing /api/purchase route issues a license with NO payment: remove it from production paths as part of this phase, with my approval, because the installer and success page depend on it. If C-11 (email provider) is unanswered, build everything except the real provider transport, then stop and ask.

HARD CONSTRAINTS
- Razorpay TEST mode only. Never use live keys. You cannot pay; I will complete test payments myself.
- The amount is always read from the database on the server. Never accept a price, amount or currency from the browser.
- No customer accounts. Customer email plus an unguessable order token identify an order.
- Never log secrets, license keys, signatures or full emails.

FACTS TO VERIFY IN CURRENT RAZORPAY DOCS (cite URLs): Orders API fields and amount unit (smallest currency unit); Checkout script and options; formula for verifying the checkout payment signature; webhook signature verification (HMAC-SHA256 of the RAW request body with the webhook secret, header X-Razorpay-Signature); duplicate detection with the x-razorpay-event-id header; the exact event names to subscribe to; that event order is not guaranteed; the API to fetch orders/payments for reconciliation; auto vs manual capture; test cards/UPI.

TASKS
1. Checkout route: validate product id, name and email; create the Order (CREATED); create the Razorpay order server-side; store its id; return the order token, public key id and Razorpay order id. Purchase model is one product per checkout unless C-30 says otherwise; keep the schema able to extend.
2. Purchase page UI (simple): name, email, pay button, Razorpay Checkout. The Checkout script domain is added to the page's CSP only on the purchase page. After payment, redirect to the order status page for that token, which polls status simply (no websockets).
3. One shared idempotent function markOrderPaid(...) used by (a) the webhook, (b) the server-side checkout-signature verification route, (c) reconciliation. It runs in a transaction, checks amount and currency against the Order, and on mismatch sets a mismatch status and writes an audit event without issuing a license.
4. Webhook route: read the raw body, verify the signature with a timing-safe comparison before parsing, de-duplicate by event id (unique constraint), handle subscribed events, return 2xx for duplicates and ignorable events, 401 for bad signatures, 5xx only for retryable failures.
5. License issuance: first read how the prototype generates and stores keys (Phase 1 audit). KEEP the current key format and storage unless it is insecure (plaintext keys in logs, non-CSPRNG, enumerable). If a change is needed, propose it with doc 04 section 6 options and WAIT for my approval, because the installer parses the key.
6. Order state machine in one module implementing docs/production/06 section 3; illegal transitions rejected and logged.
7. Emails: a transport interface; templates (order confirmation, license delivery with installer link and instruction page link) in plain text with minimal HTML; an outbox table with retry/backoff; a dev transport that prints a redacted preview. The real provider transport only after C-11 is answered. Retry processing is a callable script plus a route protected by CRON_SECRET; do not assume any scheduler.
8. Reconciliation: a script and protected route that poll Razorpay for orders stuck in PAYMENT_PENDING and for PAID orders with no license, and fix them through markOrderPaid and the issuance function.
9. Refunds/disputes: record the Razorpay events, write audit events, and flag the order NEEDS_ATTENTION. Do NOT auto-revoke or auto-refund unless C-08 has been answered; if answered, implement exactly that policy.

TESTS (real output in report)
- Unit: state machine, signature functions with locally generated vectors, amount/currency mismatch.
- API integration with locally signed webhook fixtures: valid, bad signature, duplicate event id, out-of-order events, amount mismatch, unknown event.
- Concurrency: fire 10 parallel identical webhooks; exactly one payment row and exactly one license.
- Failure injection: license creation fails after payment; order stays PAID, reconciliation fixes it, no duplicate license.
- Email outbox retry behaviour.
- Give me an exact numbered checklist for the manual Razorpay test-mode purchase (success, failure, abandoned) and what to look for in the database and emails.

DOCS TO UPDATE: 05, 06, 09, 11, 12, 17.

EXIT CRITERIA
All automated tests pass; no secret appears in logs (show a redaction test); the manual checklist is ready for me. Then REPORT and STOP.
```

---

## PHASE 5 — Activation, package download, installer, recovery

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 5 — ACTIVATION, DOWNLOAD, INSTALLER, RECOVERY
Prerequisite: Phase 4 approved. Re-read docs/production/05, 07, 08, 09 (sections 1 to 3), 10, 12, 13, 14.

Before coding, check docs/production/14 and my messages. If any of these is unanswered, STOP and list them all: C-05 (written approval to use R2 for the packages), C-06 (supported Windows versions and architectures), C-07 (activation rules: machines per license, replace/reset, deactivation), C-09 (does the installed driver itself enforce the license; permission to change client binaries). Do not choose defaults for these.

HARD CONSTRAINTS
- Never modify the client's proprietary binaries or source materials.
- Real packages are placed by me on my machine. Do not download, fetch, copy into the repo, or commit them. Tests use synthetic fixtures.
- Never expose package names, paths or hashes in public docs or logs.
- Do not promise that software cannot be copied or cracked; keep wording in line with agreement sections 02.4, 08.2 and 08.3.

TASKS
1. Backend routes per docs/05 and 07: validate, activate, package-authorize, activation-report, and (only if C-07 includes it) deactivate. Rules come from the confirmed C-07 answers, stored as configuration constants. Activation is idempotent for the same license and machine. Revoked, refunded or not-yet-issued licenses are refused. Consistent status codes and error format; audit events; rate limits per IP and per license key; responses that do not help enumeration.
2. Tokens: Ed25519 signing with a key id (kid), claims per docs/07 section 5 (token id, license id, product id, machine hash, issued-at, expiry), server-side verification on package-authorize, short expiry, key rotation support. The private key is read from the environment only. Provide a key-generation script that prints the PUBLIC key and instructions, never the private key.
3. Package authorization: look up the ProductPackage for the product and detected architecture; sign a presigned R2 URL (TTL at most 15 minutes) through the storage module; return the expected SHA-256 and size from the DATABASE, never from the bucket or the client.
4. Packaging/registration script (additive): reads an authorized local file, computes SHA-256, uploads to R2 and records the ProductPackage row. Dry-run by default; never prints credentials.
5. Installer: the existing Setup.exe is a C# .NET Framework bootstrapper (Requirements/windows-driver/bootstrapper/Program.cs) with a PowerShell alternative; keep the C# one as the base unless I approve a change, and tell me whether setup.ps1/setup.bat should still be served (default: no). The client's own MSKLC setup.exe is NOT used and not delivered. Packages: the client's products are MSKLC layouts with MSIs for amd64, i386 and ia64 and no ARM64; follow docs/production/07 sections 2 and 3 and the confirmed C-06 answer. Remove the ARM64-to-amd64 assumption unless C-06 says otherwise and it is tested; never fall back to the first MSI found. Requirements: HTTPS only with certificate validation always on; backend host allow-list; backend URL set per build environment (staging or production) without manual editing; use the server-provided SHA-256; delete the file and abort on mismatch; accurate error codes and messages; never report success unless the install step succeeded AND a post-install check passes; clean up temporary files on success, failure and cancel; limited retries with backoff and a fresh URL if expired; explicit architecture detection with a clear message for unsupported systems; a per-run temporary folder. Remove the embedded HMAC secret and the rule that accepts an unsigned payload (see docs/07 section 6): authorization uses a server-issued proof; the new public key is embedded; the installer verifies what it embeds. Fonts: install only fonts I have confirmed (C-29), handle .otf if confirmed, never copy every .ttf blindly. Report success only after a post-install check; treat msiexec 1638 as already-installed. Machine-ID derivation stays as is unless the Phase 1 audit found a defect (report first, then wait).
6. Build and signing procedure for the installer: a documented script; the code-signing certificate comes from the environment or a secure store, never from the repo; certificate purchase is a client dependency (C-19). The prototype appends a payload to the exe after signing: test whether the signature and SmartScreen behaviour survive on the downloaded file, record the result, and propose a design that keeps the signature valid if it does not.
7. License recovery per docs/09 section 3: always the same generic response; email only to the purchase address with a single-use, time-limited, hashed token; no license shown on screen; per-IP and per-email rate limits; audit events; no machine reset inside recovery. Document the manual support path (C-10).

TESTS (real output in report)
- Unit and API: every activation state (new, repeat, second machine, over limit, revoked, refunded, expired token, wrong product, wrong machine).
- Authorization tests: no token, another product's token, expired token, direct R2 URL without signature, listing attempt, expired presigned URL.
- Integrity tests with synthetic packages in the R2 staging bucket: tampered bytes, truncated download, wrong hash.
- Recovery: unknown email versus known email give identical responses; rate limit; token reuse; expiry.
- Installer logic tests where scripting allows (hash check, error mapping, cleanup).
- Produce docs/production/test-evidence/windows-test-checklist.md: a step-by-step list for me to run on clean Windows VMs for every version and architecture in C-06 (success; offline mid-download; tampered package; expired URL; re-run on the same machine; cancel; no admin rights; second machine; cloned VM), with a table to record results.

DOCS TO UPDATE: 07, 08, 09, 12, 17.

EXIT CRITERIA
All automated tests pass; installer behaviour documented as built; the Windows checklist is ready; open decisions are listed. Then REPORT and STOP.
```

---

## PHASE 6 — Contact, communications, analytics, hardening

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 6 — CONTACT, COMMUNICATIONS, ANALYTICS, HARDENING
Prerequisite: Phase 5 approved. Re-read docs/production/09, 10, 11, 12, 14.

Before coding, check docs/production/14 and my messages for C-12 (business email), C-13 (invoicing), C-14 (instruction manual / sticker / WhatsApp), C-18 (retention and policy pages), C-20 and C-21 (analytics access and scope). Implement ONLY what has been confirmed. For anything unanswered, write the manual procedure in docs, add the question to doc 14, and tell me. Do not guess how invoices, stickers or WhatsApp should work.

TASKS
1. Contact form (agreement feature): server-side validation, length caps, honeypot field, rate limit, relay to the business mailbox address supplied by the client (from environment). No CAPTCHA provider unless I approve one. Do not store messages in the database unless C-18 says so.
2. Invoicing / instruction manual / sticker / WhatsApp: build exactly what C-13, C-14, C-34 and C-35 confirm. What exists: a GST invoice template from the client (with defects listed in docs/production/06 section 11), one manual PDF and one printable sticker PDF per product (the Oriya sticker is an SVG). Do not copy the client's bank, GSTIN or PAN details into the repo; they come from environment/config owned by the client. Do not invent invoice numbering or tax rules. If WhatsApp automation is not confirmed, deliver links or attachments by email and document a manual WhatsApp procedure.
3. Business email: produce a DNS and mailbox checklist (SPF, DKIM, DMARC, provider steps) for the four mailboxes the client listed: navbrahmi, mahesh, naveen, support at brahmicomputing.in (none exist yet), in docs/09 and docs/11. Which one sends order emails and which receives the contact form is C-12: ask me. The agent cannot perform DNS changes; the checklist is for me and the client.
4. Analytics (agreement section 12.4): one simple, server-rendered, read-only page of sales by language category and by month, protected by the mechanism confirmed in C-20 (ask me; do not invent one). No customer emails in the default view. No third-party trackers.
5. SEO final pass: titles, descriptions, canonical, sitemap, robots, Open Graph; Lighthouse numbers again.
6. Security hardening: security headers and a Content-Security-Policy (allow the Razorpay Checkout domains from its current documentation; nonces instead of inline scripts), a rate-limit matrix covering every sensitive route (table in docs/05), authorization review of every route, validation review, log-redaction test, error pages without stack traces, minimal CORS, HTTPS and HSTS configuration, npm audit (fix what is safe, document the rest), a scan of the production build output for secret variable names and key-like strings.
7. Backups: a database export script and a documented restore procedure; with my help, test one restore into a scratch database.
8. Wire check:placeholders into the production build and confirm it fails while any PLACEHOLDER content remains.
9. Full regression: run every suite built so far (unit, API, DB, payment fixtures, activation, recovery, failure injection). Produce a website cross-browser and responsive checklist for me (Chrome, Edge, Firefox, Safari on desktop; iPhone and iPad Safari; Android Chrome) and an accessibility checklist.

TESTS: contact form (valid, invalid, spam, rate limit); analytics access control (unauthenticated is refused); CSP does not break checkout (describe how verified); header check; dependency audit output.

DOCS TO UPDATE: 05 (rate-limit matrix), 09, 10 (risk statuses with evidence), 11, 12, 17.

EXIT CRITERIA
All suites green with real output; every route has an authorization decision and rate-limit decision recorded; unanswered client items listed. Then REPORT and STOP.
```

---

## PHASE 7 — Deployment, acceptance, handover

```text
STANDING RULES (apply to this whole phase; do not skip any)
1. Project: NAV BRAHMI website + software purchase, licensing, machine-bound activation and secure driver distribution (agreement effective 10 Oct 2026, fee INR 70,000). Before doing anything, read docs/production/01, 02, 14 and 17 plus every doc this phase names. Doc 02 is an audit of the demo snapshot (findings F-01 to F-26): treat it as a claim to re-verify, not as truth. If a doc and this prompt disagree, STOP and ask me.
2. Do not assume anything. If something is not stated in the agreement, the docs, the repository, or my messages, it is UNKNOWN: add it to docs/production/14-client-inputs-and-open-decisions.md and ask me. Never invent prices, product names, package names, architectures, policies, page copy, colours, fonts or provider details.
3. Label statements as: VERIFIED IN REPOSITORY, VERIFIED BY TEST, STATED IN AGREEMENT, PROPOSED DESIGN, REQUIRES CLIENT CONFIRMATION, NOT IMPLEMENTED. Upgrade a label only with evidence (file path or real test output).
4. Secrets and confidentiality: never print, log, commit or paste secret values. Never commit .env files, keys, driver packages, installers, or package hashes/paths. Never upload packages anywhere except the authorized Cloudflare R2 bucket. Keep client-confidential details out of logs, fixtures, tests and docs.
5. Files: do not delete, rename or overwrite existing files unless this phase says so. Prefer additive changes and show me diffs for risky ones. Work on a branch named phase-<N>-<topic>, make small commits, and do not merge or push to main without my approval.
6. KISS: build the smallest thing that satisfies the agreement. No customer accounts or login. No features that are not in the agreement. Minimal new dependencies; justify each one in the report.
7. Stack: Next.js (App Router) + TypeScript, Prisma + Supabase PostgreSQL, Cloudflare R2, Razorpay. Keep existing choices unless this phase says otherwise. Do not assume the hosting provider; it is an open decision (C-15).
8. Check every third-party fact (Razorpay, R2, Supabase, Next.js, email provider, hosting) against the current official documentation before coding, and cite the documentation URL in your report.
9. Tests: write automated tests for what you build, run them, and paste real results in the report. Do not use browser/DOM automation for backend or installer verification (browser tools only for website UI and responsive checks). Never claim something works without running it.
10. Docs: update the affected files in docs/production/ and the statuses in docs/production/17-requirements-traceability-matrix.md in the same branch. Never mark a requirement complete without evidence.
11. Brand palette is FINAL per the client: #E51055 (primary), #FFFFFF (white), and #0066CC for links and similar uses. No other brand colours. A body-text neutral is not in the palette: use the PROVISIONAL token #231F20 (from the client's logo) and flag it for client confirmation (C-28). Never place #0066CC on #E51055 (contrast 1.2:1).
13. Known-compromised material: the prototype's Ed25519 private key, HMAC secret and a Backblaze key in doc.txt are exposed (F-01 to F-03). Never reuse them; never copy them into new files, logs or docs.
12. When finished, produce the REPORT below and STOP. Wait for my approval before anything from the next phase.

REPORT FORMAT
A. Done (bullets, with file paths)
B. Evidence (exact commands run and their real results)
C. Not done and why
D. Discrepancies found (agreement vs docs vs code)
E. Questions and decisions I must answer (with the doc 14 IDs)
F. Risks and anything touching secrets or confidential material
G. Files changed (git diff --stat)

PHASE 7 — DEPLOYMENT, ACCEPTANCE, HANDOVER
Prerequisite: Phase 6 approved. Re-read all docs in docs/production, especially 08, 11, 12, 15, 16, 17.

Before starting, check docs/production/14 and my messages for C-15 (production hosting; do not assume Vercel), C-16 (domain/DNS access), C-05 (R2 approval), live Razorpay keys from the client's verified account, and the live email provider. List anything missing and STOP if it blocks a step.

HARD CONSTRAINTS
- Every production-affecting step needs my explicit "APPROVED" first: migrations, storage upload, storage cutover, key changes, DNS, going live.
- Never delete B2 objects or revoke B2 keys in this phase; they stay as the rollback until the client-agreed window ends.
- A live test payment only with the client's approval, for a small amount, followed by a refund.
- Do not print secret values anywhere.

TASKS
1. Environments: staging and production configured on the approved host. Verify all required variable NAMES exist per docs/11 (names only). No secrets in the repository (show the scan).
2. Database: take a backup, apply migrations to production (after approval), remove prototype and test data, and verify there are no test products, licenses or orders in production.
3. R2 production cutover following docs/08 section 7: create the production bucket (private, no public access), scoped tokens, upload the authorized packages from my machine, verify hashes, switch STORAGE_PROVIDER, run smoke tests, monitor. Show unauthorized-access tests against production (no signature fails, expired URL fails, listing fails).
4. Razorpay: tell me exactly how to register the webhook URL and select events; the client switches to live keys; verify a webhook delivery reaches production and is accepted.
5. Domain and HTTPS: redirects between apex and www, HSTS, email DNS records, verified with curl and header checks.
6. Smoke tests (T-SMOKE) on production: home page, a product page, checkout up to the payment page, webhook endpoint rejects bad signatures, activation and download with a test license, installer run on a clean VM by me. Save evidence in docs/production/test-evidence/.
7. Client presentation build: confirm placeholders are gone (production build passes), list anything still pending from the client, and record the date the project was presented. Agreement section 12.1 gives the client 7 days to report defects.
8. Handover pack: complete every item in docs/production/16 with evidence, including credential rotation (the old Backblaze key, the old signing and HMAC secrets, and anything shared in plain text); update all docs to as-built; finalise docs/production/17 with evidence for each requirement; credential rotation list for every secret the developer held; key custody and rotation procedure; training notes (add products and packages, handle recovery and reset requests, read sales data); runbooks from docs/11.
9. Support records: record the final deployment date (start of the 30-day bug-fix period, section 12.3), what support excludes, and post-launch evaluation notes (up to 90 days, section 12.4, no sales guarantee).
10. Final report: status of every requirement; remaining risks; the limits of the protection model; and, without legal conclusions, the two items for the parties to review (payment schedule percentages versus amounts in section 04.2, and handover versus final-payment timing in sections 04.2, 06.3 and 12.2).

EXIT CRITERIA
Do not state that the project is production-ready unless the acceptance criteria AC-01 to AC-12 in docs/production/12 each have evidence. Then REPORT and STOP.
```

