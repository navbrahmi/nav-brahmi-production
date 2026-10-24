# 04 — Database and Data Model

> Evidence labels: doc 01 §0. Existing schema is VERIFIED IN REPOSITORY (demo snapshot). Everything else is PROPOSED and must be approved before migration. Do not treat proposed fields as confirmed requirements.

## 1. Principles

Store only what is needed; no binaries in the database; avoid unnecessary personal data; keep types portable (text, integer, boolean, timestamptz, limited jsonb); enums or CHECK constraints for statuses; money as integer minor units.

## 2. Existing schema (VERIFIED IN REPOSITORY)

| Model    | Fields                                                                                                                 | Problems for production                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Product  | id, name, description, `price Float`, createdAt                                                                        | float money; no product code, slug, category, active flag, currency, tax info                              |
| Purchase | id, email, productId, `status` (default `COMPLETED`), createdAt                                                        | created without payment; no amount, order/payment references                                               |
| License  | id, email, productId, `licenseKey` (unique, plaintext), status, createdAt, activatedAt, activationStatus, `machineId?` | one machine only; key stored in clear; email duplicated; no order link; no revoke reason; status free text |

Migrations: `init`, `add_activation` (+ lock). No indexes except unique license key. No seed data of the client's real products.

## 3. Proposed entities

| Entity              | Purpose                                      | Key fields (PROPOSED)                                                                                                     | Status vs existing                                                                                         |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Customer (optional) | One row per purchaser email                  | id, email (normalised), name, mobile?, createdAt                                                                          | NEW. Could be folded into Order; keep only if recovery/invoices need it.                                   |
| Product             | Customer-facing product (14 delivered)       | id, slug, code, displayName, categoryRef, priceMinor (paise), currency, taxInclusive (bool), isActive                     | CHANGE existing: replace float price. Price value: C-02.                                                   |
| ProductPackage      | Downloadable file per product × architecture | id, productId, version, architecture (x64/x86/… per C-06), objectKey, sha256, sizeBytes, isActive                         | NEW; replaces package definitions in source code.                                                          |
| ProductAsset        | Manual PDF / sticker PDF / logo per product  | id, productId, kind (manual/sticker), objectKey or public path, isPublic                                                  | NEW; public vs private: C-35.                                                                              |
| Order               | Purchase record                              | id, publicToken (unguessable), customerEmail, productId, status, amountMinor, currency, createdAt, billing fields (below) | REPLACES Purchase.                                                                                         |
| Payment             | Razorpay transaction                         | id, orderId, provider, providerOrderId, providerPaymentId, providerEventId(s), status, rawStatus, verifiedAt              | NEW.                                                                                                       |
| License             | Entitlement                                  | id, orderId, productId, keyLookupHash (or key per §6), status, maxActivations, issuedAt, revokedAt, revokeReason          | CHANGE existing.                                                                                           |
| Activation          | Machine binding                              | id, licenseId, machineIdHash, firstSeenAt, lastSeenAt, status                                                             | NEW; replaces `License.machineId`.                                                                         |
| AuditEvent          | Security/ops trail                           | id, at, type, actorType, refType/refId, metadata (no secrets)                                                             | NEW.                                                                                                       |
| RateLimitBucket     | DB-backed limiter                            | key, windowStart, count                                                                                                   | NEW (doc 05).                                                                                              |
| EmailOutbox         | Reliable email sending                       | id, kind, toEmail, payload ref, status, attempts, nextAttemptAt                                                           | NEW (doc 09).                                                                                              |
| RecoveryToken       | Single-use recovery links                    | id, orderOrEmailRef, tokenHash, expiresAt, usedAt                                                                         | NEW (doc 09).                                                                                              |
| Invoice             | Sequential tax invoice record                | id, orderId, invoiceNumber (unique, sequential), issuedAt, totals, pdf ref                                                | NEW, **only if C-13 confirms invoices are generated by the system.** Numbering rules: client's accountant. |

**Billing fields for the invoice template (CLIENT-SUPPLIED):** bill-to name and mobile, address, state, optional GSTIN. Checkout today would collect only name and email. Collect more fields or issue a simplified invoice: **REQUIRES CLIENT CONFIRMATION (C-34).** Do not store bank details, GSTIN/PAN or other business identifiers of the client in the database; they belong in configuration managed by the client.

Order↔License cardinality (single product per checkout vs cart): C-30.

## 4. Relationships

Customer(1)—(N) Order · Product(1)—(N) Order · Order(1)—(N) Payment · Order(1)—(N) License · License(1)—(N) Activation · Product(1)—(N) ProductPackage · Product(1)—(N) ProductAsset · Order(1)—(0..1) Invoice · AuditEvent references any.

## 5. Constraints and indexes (PROPOSED)

UNIQUE(Payment.provider, providerPaymentId); UNIQUE(Payment event id); UNIQUE(License key lookup); UNIQUE(Activation.licenseId, machineIdHash); UNIQUE(ProductPackage.productId, architecture, version); UNIQUE(Product.slug); UNIQUE(Invoice.invoiceNumber); FKs `ON DELETE RESTRICT`; INDEX(Order.status, createdAt); INDEX(Order.customerEmail); INDEX(AuditEvent.refType, refId, at). Status columns as enums/CHECK.

## 6. License key storage — decision required

Existing: key stored in clear, unique. Options: (a) store a keyed hash only (cannot re-display); (b) hash for lookup plus encrypted copy (re-display possible; key management needed). Existing key format `NAV-XXXX-XXXX-XXXX-XXXX` (64 bits of randomness) is parsed by the installer; any change must be coordinated with the installer. **REQUIRES CLIENT CONFIRMATION / developer decision.**

## 7. Data retention and privacy

Minimal data: email, name, billing fields only if invoices require them, payment references (no card data ever). Retention periods, deletion/export procedure and any applicable data-protection or tax record-keeping duties (for example India's DPDP Act, 2023, and GST invoice records) are for the client and its advisers (C-18); no legal conclusions here. Hash machine identifiers; avoid plain-text IP logging.

## 8. Migration strategy

- The existing schema was created with `prisma migrate` (2 migrations): continue with Prisma Migrate; **baseline production from the existing migrations** and add new ones; staging first; backup before each production migration.
- Existing prototype data (demo products, test purchases and licenses) must be **removed or kept out of production**; they are not the client's products.
- Price `Float` → integer paise needs a data migration step even if empty.
- Changes requiring approval: license key storage method; billing fields; invoice table; any change to rows holding real data.
- Future provider migration: standard SQL; export with `pg_dump`; re-point `DATABASE_URL`; `prisma migrate deploy`. No abstraction layer.


## Phase 2 Schema Expansion (VERIFIED IN REPOSITORY)
- Migration `20261024093000_expand_schema_phase2` generated via Prisma.
- Implements expand-only strategy: `Purchase`, `Product.price`, `License.machineId`, `License.activationStatus` retained for backward compatibility with existing routes.
- In-place conversion of `License.status` via `ALTER COLUMN "status" TYPE "LicenseStatus" USING status::"LicenseStatus"`.
- Verified against local scratch PostgreSQL database (`prisma migrate deploy`).
