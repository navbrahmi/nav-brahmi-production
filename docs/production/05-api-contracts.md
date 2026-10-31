# 05 — API Contracts

> Evidence labels: doc 01 §0. §1 is VERIFIED IN REPOSITORY (demo snapshot). §3 is the **PROPOSED** production contract; route names are placeholders to reconcile with the existing ones — do not rename routes the installer calls without a coordinated installer release.

## 1. Existing route inventory (VERIFIED IN REPOSITORY; demo snapshot)

| Method | Path                         | Purpose                                                     | Auth                         | Rate limit | Production disposition                                                                                                    |
| ------ | ---------------------------- | ----------------------------------------------------------- | ---------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/purchase`              | Creates Purchase + License from email + product; no payment | none                         | none       | **Remove/replace** with Razorpay checkout (doc 06). F-04                                                                  |
| POST   | `/api/validate-license`      | Validates key; returns presigned URL + SHA-256              | none                         | none       | **Rebuild:** validation must not hand out downloads; downloads require an activation token. F-06                          |
| POST   | `/api/license/validate`      | Alias of the above                                          | none                         | none       | Remove (duplicate)                                                                                                        |
| POST   | `/api/activation`            | One-machine binding; issues Ed25519 token                   | none                         | none       | **Rebuild** with Activation table, atomic binding, rules from C-07. F-11                                                  |
| GET    | `/api/download-installer`    | Serves Setup.exe with appended payload; also ps1/bat        | none (key in query)          | none       | **Rebuild:** authorize by signed, expiring link; no license key in URLs; stop serving ps1/bat unless approved. F-09, F-17 |
| POST   | `/api/license/recover`       | Returns all licenses for an email                           | none                         | none       | **Replace** with email-link recovery (doc 09). F-05                                                                       |
| POST   | `/api/license/resolve-token` | Exchanges purchase token for license details                | HMAC token (fallback secret) | none       | Remove or rebuild after the token redesign                                                                                |

Existing route paths may be kept where behaviour is rebuilt; do not break the installer without a coordinated installer release.

## 2. Cross-cutting rules (PROPOSED)

- **Format:** JSON; errors `{ "error": { "code": "STRING", "message": "safe text", "requestId": "..." } }`.
- **Status codes:** 200/201 success; 400 validation; 401 bad signature/token; 403 forbidden state (revoked, limit reached); 404 unknown (but see enumeration note); 409 conflict/duplicate; 410 expired link; 429 rate limited; 500/503 server/dependency (generic message).
- **Validation:** schema validation (e.g., zod) on every body/query; max sizes; reject unknown fields on sensitive routes.
- **Anti-enumeration:** license/recovery endpoints return indistinguishable responses for unknown vs. non-matching inputs where practical.
- **Logging:** never log license keys, tokens, signatures, presigned URLs, or full emails.
- **Idempotency:** webhooks and activation retries are idempotent (below).

## 3. Proposed endpoints

| Endpoint (placeholder)         | Caller                            | AuthN/Z                                                                                                            | Validation                                                              | Idempotency                                         | Rate limit                    | Touches            |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------------------------- | ----------------------------- | ------------------ |
| `GET /api/products`            | browser                           | public                                                                                                             | —                                                                       | —                                                   | light                         | DB                 |
| `POST /api/checkout`           | browser                           | public + bot protection                                                                                            | productId, name, email                                                  | order id server-generated                           | per IP/email                  | DB, gateway        |
| `POST /api/payments/webhook`   | Razorpay                          | **`X-Razorpay-Signature`** (HMAC-SHA256 of the raw body with the webhook secret)                                   | Razorpay event schema                                                   | unique `x-razorpay-event-id` + unique payment id    | allow gateway; reject bad sig | DB, email          |
| `POST /api/checkout/verify`    | browser (after Razorpay Checkout) | Razorpay checkout signature verified server-side with the API secret                                               | order token, razorpay_order_id, razorpay_payment_id, razorpay_signature | same shared `markOrderPaid` function as the webhook | per IP/token                  | DB                 |
| `GET /api/orders/status`       | browser                           | unguessable order token (not sequential id)                                                                        | token                                                                   | —                                                   | per IP                        | DB                 |
| `GET /api/installer/download`  | browser/email link                | signed, expiring link tied to license/order                                                                        | token                                                                   | —                                                   | per token/IP                  | DB, (R2)           |
| `POST /api/license/validate`   | installer                         | license key + product                                                                                              | key format, productId                                                   | read-only                                           | per IP & per key              | DB                 |
| `POST /api/license/activate`   | installer                         | license + machineIdHash + installer proof                                                                          | schema                                                                  | same (license, machine) returns same activation     | strict per IP/key             | DB                 |
| `POST /api/package/authorize`  | installer                         | activation token (Ed25519, verified server-side) + machine hash                                                    | token                                                                   | —                                                   | per activation                | DB, R2 (signs URL) |
| `POST /api/activation/report`  | installer                         | token                                                                                                              | status enum, error code                                                 | dedupe                                              | moderate                      | DB audit           |
| `POST /api/orders/[token]/refund-request` | customer browser | valid unguessable order token; rate-limited (5/15m per IP & token) | reason (10-2000 chars), optional email matching order | dedupe per order; blocks duplicate PENDING_REVIEW | per IP & order token | DB (RefundRequest), outbox email |
| `POST /api/license/deactivate` | installer/support                 | **DEACTIVATION RESTRICTED PER C-07**: Customer self-service deactivation endpoint disabled (returns 400). Reset executed via authorized server-side administrative engine (`scripts/admin-machine-reset.ts`) with 90-day cooldown. | supportTicketRef, reason, licenseId/orderRef | idempotent | administrative only | DB (Activation, License, Audit) |
| `POST /api/recovery/request`   | browser                           | email (+optional order ref)                                                                                        | email                                                                   | generic response always                             | strict per IP & email         | DB, email          |
| `GET /api/recovery/redeem`     | email link                        | single-use hashed token                                                                                            | token                                                                   | one-time                                            | per token                     | DB                 |
| `POST /api/contact`            | browser                           | bot protection                                                                                                     | name, email, message length caps                                        | —                                                   | strict                        | email              |
| `GET /api/admin/sales`         | client staff                      | **admin auth — mechanism REQUIRES CLIENT CONFIRMATION** (no customer login; admin protection needed for analytics) | filters                                                                 | —                                                   | moderate                      | DB                 |

## 4. Payment webhook rules

Verify signature on the **raw** body (do not parse first) using a timing-safe comparison; check amount/currency/product match the stored order; process in one DB transaction; record the `x-razorpay-event-id`; respond 2xx for duplicates; 5xx only for retryable failures; event order is not guaranteed, so handlers must tolerate out-of-order events. The webhook secret is separate from the API key secret. See doc 06 §10. Exact event names and the checkout-signature formula must be confirmed against current Razorpay documentation at implementation time.

## 5. Package authorization response (PROPOSED)

`{ "url": "<presigned GET>", "expiresInSeconds": 900, "fileName": "...", "sha256": "<expected>", "sizeBytes": n, "version": "..." }`. The `sha256` comes from DB (ProductPackage), never from the bucket or client.

## 6. Dependency interactions

DB writes inside transactions for issue/activate; Backblaze B2 only signs URLs (no proxying large files through the function; R2 migration cancelled per C-05); payment provider via Razorpay REST API/webhooks (TEST MODE implemented); email via provider API with retry queue/outbox (doc 09).

## 7. Phase 4 Implementation Status (VERIFIED IN REPOSITORY & VERIFIED BY TEST)

- `POST /api/checkout`: Implemented with verified product pricing from database, customer email validation, rate limiting, and safe test-mode response.
- `POST /api/checkout/verify`: Implemented with timing-safe HMAC-SHA256 signature verification and transactional `markOrderPaid` completion.
- `POST /api/payments/webhook` (and `/api/purchase/webhook` alias): Implemented with raw-body signature verification, database-backed deduplication on `x-razorpay-event-id`, and transactional `markOrderPaid` completion.
- `GET /api/orders/status`: Implemented with unguessable token lookup, email masking, rate limiting, and strict anti-leakage (never exposes raw license keys).
- `POST /api/cron/email-outbox`: Implemented with Bearer `CRON_SECRET` protection and exponential retry backoff.
- `POST /api/cron/reconcile`: Implemented with Bearer `CRON_SECRET` protection and safe, idempotent license recovery.
- `POST /api/purchase`: Free unpaid license generation disabled (F-04 closed with evidence).

## 8. Phase 6 Implementation Status (VERIFIED IN REPOSITORY & VERIFIED BY TEST)

- `POST /api/orders/[token]/refund-request`: Implemented with 7-calendar-day eligibility calculation from server-recorded `installedAt` timestamp (C-08/C-18). Falls back to manual support review if installation timestamp is missing rather than rejecting. Enforces duplicate request blocking (`DUPLICATE_REQUEST_PENDING`) and fixed-window rate limiting. Records requests with `PENDING_REVIEW` database status. Asynchronously queues support staff alerts via Resend email outbox (`REFUND_REQUEST_RECEIVED`). Zero automatic refund processing; zero automatic license revocation on intake.
- `executeSupportMachineReset` (`scripts/admin-machine-reset.ts` & `src/lib/admin-reset.ts`): Restricted administrative maintenance operation implementing confirmed one-machine rule (C-07). Requires valid license or order reference, verified support ticket identifier, and recorded reason. Enforces 90-day cooldown period per license unless explicit administrator override flag is supplied. Invalidates previous machine bindings (`ActivationStatus.REVOKED`) and invalidates existing activation tokens (preventing further package downloads via `POST /api/package/authorize`). Logs security audit events without leaking secrets or machine hashes. Public self-service deactivation remains unavailable.
- `POST /api/checkout`: Reconciled against confirmed ₹472.00 (47200 paise) retail price per language package (C-02). Strictly rejects checkout for unconfirmed product bundles (e.g. Tamil & Tamil Grantha pending C-03 resolution).


