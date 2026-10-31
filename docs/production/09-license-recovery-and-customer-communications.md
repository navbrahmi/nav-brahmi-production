# 09 — License Recovery and Customer Communications

> Evidence labels: doc 01 §0. A recovery route and page exist (VERIFIED IN REPOSITORY) but are **insecure**: `/api/license/recover` returns license keys and installer tokens in the response to anyone who types a purchaser's email, and reveals whether an email has purchases (F-05). Email sending, contact form, invoicing and WhatsApp do not exist (NOT IMPLEMENTED).

## 1. Recovery: as found
The existing flow takes an email, finds active licenses (case-insensitive), and returns each key, product, activation status and an installer download link containing a purchase token. It has no proof of ownership, no rate limit, no audit event, and different responses (404 vs 200) for unknown vs known emails. It must be **replaced**, not patched.

## 2. Principle
Knowing an email address alone is **not** proof of ownership. Recovery must not reveal licenses on screen to whoever types an email.

## 3. Proposed recovery workflow
1. Customer enters email (optionally order reference/product) on the recovery page.
2. Response is always generic: "If a matching purchase exists, we've emailed instructions."
3. If a match exists, an email goes **only to the purchase email** with a single-use, time-limited (e.g., 30 min) link; token stored hashed.
4. Link leads to a page offering re-download of the authorized installer (license embedded/delivered per design) or re-sending the license email.
5. Event logged (no secrets).
- **Machine binding:** recovery does not reset activations. A separate reset policy (support-mediated or self-service) is **REQUIRES CLIENT CONFIRMATION**.
- **Original email inaccessible:** manual support path via business email with agreed proof (order ID, payment reference, invoice). Verification rules: **REQUIRES CLIENT CONFIRMATION**.
- **Abuse prevention:** per-IP and per-email rate limits, bot challenge after thresholds, uniform timing/responses, alerts on bursts.
- **Errors/audit:** audit events for request, redeem, failure; user messages never reveal whether an email exists.

## 4. Customer emails (PROPOSED set)
| Email | Trigger | Contents |
|---|---|---|
| Order confirmation | Order paid | Product, amount, order ref |
| License delivery | License issued | License key, installer link, instructions link, support contact |
| Recovery | Recovery request | Single-use link |
| Failure/pending | Delay in issuance | Reassurance + support contact |
| Refund/revocation | Policy action | Neutral notice |
Templates, language(s) (English only? regional languages?) and sender identity: client approval. Use client's domain sender with SPF/DKIM/DMARC; transactional provider with delivery logs; outbox with retries.

**Phase 4 Implementation (VERIFIED IN REPOSITORY & VERIFIED BY TEST):**
- Email transport abstraction (`EmailTransport`, `DevEmailTransport`, `MockEmailTransport`) in `src/lib/email/transport.ts`.
- License delivery templates (plain text + accessible semantic HTML) in `src/lib/email/templates.ts`.
- Outbox retry engine in `src/lib/email/outbox.ts` with exponential backoff and order delivery state advancement (`OrderStatus.DELIVERED`).
- CLI script `scripts/process-email-outbox.ts` and protected route `POST /api/cron/email-outbox` (requires `CRON_SECRET`).
- Redacted development preview transport logs previews without leaking secrets, full emails, or raw license keys.
- Verified by automated tests in `tests/integration/email-outbox.test.ts`.

**Phase 5 Implementation — Secure License Recovery & Resend Transport (VERIFIED IN REPOSITORY & VERIFIED BY TEST):**
- **Anti-Enumeration Recovery Request** (`src/app/api/license/recover/route.ts`): Returns identical generic JSON success messages for registered and unregistered emails (F-05 remediation).
- **Single-Use Cryptographic Recovery Tokens**: 32 bytes CSPRNG entropy, stored exclusively as SHA-256 hashes in `RecoveryToken` table with a 15-minute expiry.
- **Authenticated Encryption at Rest (AES-256-GCM)** (`src/lib/license-crypto.ts`):
  - License keys are encrypted with AES-256-GCM before writing to Supabase PostgreSQL (`encryptedKey`, `keyIv`, `keyTag`, `keyVersion`).
  - Plaintext license keys are NEVER stored in the database (`licenseKey: null`).
  - Key lookup is performed via deterministic SHA-256 hash (`keyLookupHash`).
  - Decryption occurs strictly in-memory during email dispatch; keys are never logged.
  - Legacy unencrypted records fall back gracefully; records without keys prompt the customer to contact support.
- **Secure Token Redemption Flow** (`src/app/api/recovery/redeem/route.ts`):
  - Consumes token atomically (`usedAt = new Date()`) within a database transaction.
  - Does NOT display raw or masked license keys on screen; returns clean success message directing customer to check their inbox.
  - Transactionally queues a `LICENSE_RECOVERY` email in `EmailOutbox` addressed solely to the original purchase email.
  - Triggers immediate outbox dispatch via `processEmailOutbox`.
  - Machine activations are strictly preserved (no machine reset or unbinding).
- **Resend Transport Configuration** (`src/lib/email/transport.ts`):
  - Domain `brahmicomputing.in` DNS verification confirmed verified via Resend dashboard.
  - Active Zoho business email confirmed.
  - Default sender configured as `Nav Brahmi <support@brahmicomputing.in>`.
- Verified by automated tests in `tests/integration/license-recovery.test.ts` (4/4 passed) and `tests/unit/license-crypto.test.ts` (6/6 passed).

## 5. Contact form
Fields: name, email, message (length caps), optional product. Server-side validation, honeypot/CAPTCHA, rate limit, relay to business mailbox, no DB storage unless retention is agreed. Auto-acknowledgement optional.

## 6. Business email setup (§02 feature)
CLIENT-SUPPLIED: four mailboxes to create on `brahmicomputing.in`: navbrahmi@, mahesh@, naveen@, support@ (none exist yet). The client's notes also mention a GoDaddy account (presumably the domain registrar; whether GoDaddy also provides hosting or mailboxes is not stated: C-15, C-16). Provider and cost are the client's (§06.4). Which address sends order emails (for example support@) and receives contact-form messages: C-12. Deliverable boundary: DNS records (SPF, DKIM, DMARC as the provider requires) and mailbox creation; ongoing mailbox administration is the client's. The client's account credentials were delivered in plain text and must be changed (doc 16).

## 7. Invoicing / manual / sticker by WhatsApp or email (§02 feature)
What the client supplied (CLIENT-SUPPLIED):
- **Invoice:** a GST tax invoice template (two identical spreadsheets). Defects and tax questions: doc 06 §11. Whether the system generates invoices automatically, and how invoice numbers are assigned, is open (C-13, C-34).
- **Manual:** one PDF per product (3–4 pages), containing About/Vision text, features, usage, the price line and patent/brand statements.
- **Sticker:** one A4 print-at-home PDF per product with a keyboard-label sheet and print instructions (the Oriya sticker is an SVG, not a PDF).
- Therefore "manual/sticker by WhatsApp/Email" most plausibly means **sending these digital files**; no physical shipping is evidenced. Confirm (C-14).

PROPOSED default until confirmed: the license email links to (or attaches) the invoice, the product's manual and sticker; a manual WhatsApp procedure is documented. WhatsApp automation (Business API) needs a client-owned WhatsApp Business account, template approval and fees: only if the client asks for it.

Whether manuals/stickers are public downloads or purchase-only: C-35. Claims inside the manuals (patent statements, efficiency claims, price text) must not be reused on the website without client approval.

## 8. Dependencies
Email provider account; DNS access; WhatsApp Business account (if automated); invoice template/branding; client-supplied manual and sticker files.

## 9. Phase 6 Customer Support and Notifications (VERIFIED IN REPOSITORY & VERIFIED BY TEST)

- **Official Customer Support Contact (C-10, C-17):**
  - Email: `support@brahmicomputing.in`
  - Phone: `9632819063`
  - Displayed consistently across website header, footer, contact page, installation instructions, order recovery pages, and automated customer emails.
  - Zero invented information: No unconfirmed office hours, physical street addresses, or WhatsApp support availability are advertised.
- **Refund Request Intake & Support Alerts (C-08 & C-18):**
  - Customer refund requests submitted via `POST /api/orders/[token]/refund-request` are recorded in `RefundRequest` with status `PENDING_REVIEW`.
  - Transactionally queues an alert email to support (`EmailType.REFUND_REQUEST_RECEIVED`) in `EmailOutbox` addressed to `support@brahmicomputing.in`.
  - Dispatched via Resend email transport. Support staff receives order reference, customer email, installation timestamp, and customer's problem description.
- **Support-Assisted Machine Reset Operational Procedure (C-07):**
  - Customers requiring a machine transfer (e.g. PC replacement or hardware failure) must contact `support@brahmicomputing.in` from their original purchase email, providing the order reference.
  - Support verifies purchase ownership and verifies whether the 90-day cooldown period has elapsed.
  - If approved, an authorized administrator executes the server-side reset script (`scripts/admin-machine-reset.ts`) recording the support ticket reference and reason.
  - The previous machine binding and old activation tokens are revoked, allowing the customer to activate on their new Windows 11 machine.

