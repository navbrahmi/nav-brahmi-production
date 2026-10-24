# 06 — Purchase, Payment and License Flow

> Evidence labels: doc 01 §0. Provider is Razorpay (stated by developer; written client confirmation and account ownership pending, C-01). **No payment code exists** in the demo repo (VERIFIED IN REPOSITORY): `/api/purchase` issues licenses for free (F-04) and must be replaced. Flow below is **PROPOSED DESIGN**. Business rules are listed as open, not decided.

## 1. End-to-end workflow (PROPOSED)
1. Customer selects a product (one of the real client products — doc 13).
2. Enters name and email; email format validated; confirmation shown.
3. Backend creates Order (`CREATED`) with price from the **database**, never from the browser. Price: client materials say ₹480 including all taxes (manuals) but the invoice template computes ₹472 (₹400 + 18% GST) — **C-02 must be resolved first**. Store money as integer paise.
4. Backend creates a **Razorpay Order** server-side (Orders API; amount in the smallest currency unit, INR) and stores its id; Order → `PAYMENT_PENDING`. The browser opens Razorpay Checkout with that order id.
5. Customer pays at the gateway.
6. Gateway sends a signed webhook; backend verifies signature, amount, currency, order match.
7. Order → `PAID`; Payment recorded (unique provider id).
8. In the same transaction (or an atomic outbox step) a License is generated → Order `LICENSE_ISSUED`.
9. Email sent (confirmation + license delivery + installer link) → `DELIVERED` when send accepted.
10. Customer proceeds to installer (doc 07).

## 2. Trusted payment verification
- Only these may set `PAID`, all through one shared idempotent function: (a) a signature-verified Razorpay webhook; (b) the Razorpay checkout signature verified **server-side** with the API secret; (c) a server-to-server fetch of the order/payment from Razorpay (reconciliation).
- Browser redirects and unsigned client data never change state.
- Compare provider amount/currency to Order; mismatch → `PAYMENT_MISMATCH` + audit event, no license.

## 3. Order state machine (PROPOSED)
```
CREATED → PAYMENT_PENDING → PAID → LICENSE_ISSUED → DELIVERED
   │             │            │
   └→ EXPIRED    └→ FAILED    └→ (issue failure → PAID_NEEDS_ATTENTION)
DELIVERED/LICENSE_ISSUED → REFUNDED | DISPUTED → REVOKED (per policy)
```
Terminal/transition rules are enforced in code; illegal transitions are rejected and logged.

## 4. License generation
Cryptographically secure random (CSPRNG) key, sufficient entropy, human-friendly grouping, checksum characters optional. Stored as keyed hash (doc 04 §6). One license per purchased product unless client states otherwise. Key format and prefix: **REQUIRES CLIENT CONFIRMATION** (installer parsing must match).

## 5. Duplicate webhooks
Unique constraint on provider payment/event id; handler is idempotent: second delivery finds existing Payment and returns 200 without a second license. Concurrent deliveries are serialized by the unique constraint/transaction.

## 6. Failure recovery
| Failure | Handling (PROPOSED) |
|---|---|
| Payment succeeded, license creation failed | Order stays `PAID`; reconciliation job retries issuance; alert to operator; customer sees "processing"; never auto-refund without client policy. |
| Email send failed | Outbox retry with backoff; "resend delivery" operator action; recovery flow as fallback. |
| Webhook never arrives | Reconciliation job polls provider for `PAYMENT_PENDING` orders older than N minutes. |
| Webhook before order lookup (race) | Return 5xx/retry-safe response; provider retries. |
| Database unavailable | 503; webhook retried by provider. |

## 7. Refunds, cancellations, revocation
Currently **no policy exists in the agreement**. Decisions needed (doc 14): when is a refund allowed; does refund revoke the license; effect on already-activated machines (installed driver may keep working — see doc 07 §8); dispute handling; who executes refunds in the gateway. Engineering provides: `REFUNDED`/`DISPUTED`/`REVOKED` states, revoke action with reason, audit event, and blocking of new activations/downloads.

## 8. Customer communications at each step
Order confirmation; license delivery; failure/pending notice; refund notice. Content and language: client-approved templates (doc 09).

## 9. Unresolved business rules
Razorpay account ownership/verification, capture mode and fee handling; tax-inclusive price vs invoice template (₹480 vs ₹472); invoice fields and numbering; currency/GST display; refund/revocation policy; multi-product cart; coupons (not in scope unless approved); test vs live cutover; invoice generation timing.

## 10. Razorpay specifics
Verified against Razorpay's webhook documentation: webhooks carry `X-Razorpay-Signature` (HMAC-SHA256, webhook secret as key, **raw** request body as message); duplicates are identified with the `x-razorpay-event-id` header (unique per event); the webhook secret need not equal the API key secret; if the secret is changed, retries of older events may need the old secret.

To confirm in the current docs at implementation time (not assumed here): Orders API request fields and amount unit; Checkout script/options; the formula for verifying the checkout payment signature; exact event names to subscribe (e.g., payment captured / order paid / payment failed / refund processed / dispute events); auto-capture vs manual capture; test cards/UPI in test mode; whether the live account requires policy pages (privacy, terms, refund) for activation.

Open items: who owns the Razorpay account and completes business verification for live mode; test and live keys; webhook URL registration; capture mode; settlement account; who performs refunds (dashboard or API).

## 11. Invoice and delivery items that depend on the order (CLIENT-SUPPLIED template; C-13, C-14, C-34)
- The supplied template is a GST tax invoice (Karnataka supplier, CGST + SGST lines). Bill-to needs name/mobile, address, state, optional GSTIN; checkout currently collects name and email only.
- Template defects the client must fix before it is used as a source: amount-in-words does not match the amount; phone and email differ from the agreement (phone +91 9845980534 vs 9632819063; email spelled navbrahmail@gmail.com vs navbrahmi@gmail.com); spelling errors; the date shown is 1 Nov 2026.
- For a tax-inclusive price of ₹480 at 18%, the arithmetic split is taxable value ₹406.78 + tax ₹73.22 (rounded); whether the client wants that, or ₹400 + ₹72 = ₹472, is the client's and its accountant's decision. Customers outside Karnataka may need a different tax line than the template shows: ask the client's accountant.
- Per-product manual and sticker PDFs go out with the license email (doc 09). The client's bank and tax identifiers belong in configuration owned by the client, never in the repository.

## 12. Phase 4 Implementation & Verification (VERIFIED IN REPOSITORY & VERIFIED BY TEST)

- **Single Idempotent Payment Function:** `markOrderPaid` implemented in `src/lib/payment-completion.ts`. Verified with PostgreSQL row locking (`SELECT FOR UPDATE`), validating amount and currency against database order, and issuing CSPRNG license keys with SHA-256 lookup hash.
- **Race Condition & Concurrency Defense:** Verified by automated test with 10 simultaneous parallel webhooks (`tests/integration/concurrency-webhook.test.ts`), resulting in strictly 1 license and 1 captured payment record.
- **Failure Recovery:** Reconciler in `src/lib/reconciliation.ts` verified to recover stuck orders and issue missing licenses safely without generating duplicate licenses (`tests/integration/failure-reconciliation.test.ts`).
- **Timing-Safe Signatures:** Checkout and raw-body webhook signature verification implemented with timing-safe comparison in `src/lib/razorpay.ts` (`tests/unit/razorpay-signatures.test.ts`).
- **Gateway Mode:** Strictly enforced in TEST MODE. Live payments prohibited until client credentials and approved legal policies are supplied.

