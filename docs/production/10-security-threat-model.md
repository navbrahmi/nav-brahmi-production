# 10 — Security Threat Model

> Evidence labels: doc 01 §0. Risks marked *(hypothesis)* must be confirmed in the audit. The agreement acknowledges no system can guarantee prevention of copying/circumvention (§08.2, §08.3); this model aims at reasonable measures.

## 1. Assets
Client driver packages (NDA); license keys; private signing key(s); R2 and DB credentials; payment webhook secret; customer emails/names; order/payment records; installer integrity; client's brand/domain.

## 2. Threat actors
Casual pirate (shares installer/key); technical cracker (patches/reverses installer); license key guesser/enumerator; fraudster (payment manipulation, chargebacks); scraper/bot; malicious insider/contractor; opportunistic attacker via leaked credentials; third-party provider incident.

## 3. Risk register
| ID | Risk | Likelihood/Impact | Mitigation | Status |
|---|---|---|---|---|
| R1 | **Driver ZIPs committed in Git repo** (README lists them) — NDA exposure via repo, clones, history *(hypothesis)* | High impact | Confirm repo is private; inspect history; remove from tracking and, with client/KREOVI approval, purge history and rotate access; store only in R2/secure workstation; add `.gitignore` + pre-commit scan | Open |
| R2 | Unpaid user marks order paid via browser | High | Webhook-signature-only state change | Proposed |
| R3 | Duplicate/replayed webhooks create multiple licenses | Medium | Unique provider ids, transaction | Proposed |
| R4 | License key brute force/enumeration | Medium | High-entropy keys, rate limits, uniform errors, lockouts | Proposed |
| R5 | Recovery abuse (email known to attacker) | Medium | Email-only delivery, single-use tokens, generic responses | Proposed |
| R6 | Package theft via guessable URLs/listing | High | Private bucket, no listing, short TTL, per-activation authorization | Proposed |
| R7 | Token tampering/replay | Medium | Ed25519 verify server-side, expiry, machine binding, `kid` | Proposed |
| R8 | Secret embedded in installer (HMAC) — **confirmed**: constant in source and in every Setup.exe; unsigned payload accepted | High | Replace with server-issued proof; server decides (doc 07 §6) | Confirmed finding F-02/F-16 |
| R9 | Machine ID spoofing/cloning | Medium | Accept as limitation; activation limits; audit anomalies | Accepted/limit |
| R10 | Shared installer+license after one legit purchase | High likelihood | Activation limit per license; monitoring; accept residual risk | Accepted/limit |
| R11 | Secrets in repo/logs/bundles — **confirmed** (F-01, F-02, F-03) | Critical | Rotate: new Ed25519 pair, new HMAC/token secret, new B2 key; delete `doc.txt`; remove source fallbacks; secret scan in CI | Confirmed; action in doc 15 Phase 1–2 |
| R12 | Unsigned installer flagged/tampered | Medium | Code signing, checksum on site | Proposed |
| R13 | API abuse/DoS on activation/contact | Medium | Rate limit, bot protection, body caps | Proposed |
| R14 | Customer data exposure (DB misconfig, Supabase keys/RLS) | High | Server-side DB access only; restrict anon key use; least privilege | Proposed |
| R15 | Third-party outage/incident (§09) | Medium | Retries, reconciliation, runbooks | Proposed |
| R16 | Dependency vulnerabilities | Medium | `npm audit`, lockfile, Dependabot, pin versions | Proposed |

## 3a. Findings from the existing-system audit (VERIFIED IN REPOSITORY; doc 02 §8)
| ID | Risk | Mitigation |
|---|---|---|
| R17 | Forgeable activation tokens: private signing key is in source (F-01) | New key pair; env-only; `kid`; verify server-side; treat old key as compromised |
| R18 | Forgeable purchase tokens/installer payloads: HMAC secret in source and exe (F-02) | Remove; use server-issued proof |
| R19 | Live storage credentials in `doc.txt` (F-03) | Rotate the B2 key now; delete file; check history |
| R20 | Free licenses: `/api/purchase` needs no payment (F-04) | Remove; Razorpay-verified issuance only |
| R21 | License disclosure via recovery (F-05) | Email-link recovery; generic responses |
| R22 | Download without activation (F-06) | Package authorization requires activation token |
| R23 | No rate limits/validation/audit (F-07) | Doc 05 §2; DB-backed limiter |
| R24 | Wrong product served/sold on unknown id (F-08) | Fail closed |
| R25 | License keys readable in tokens, URLs and DB (F-09) | Remove from tokens/URLs; storage per doc 04 §6 |
| R26 | Windows-on-ARM/ia64 mis-selection (F-13) | Explicit architecture matrix |
| R27 | Signature breakage/untrusted signer (F-17) | Real certificate; sign after final assembly or deliver payload separately |
| R28 | Client account credentials delivered in plain text (client zip) | Client changes passwords, enables 2FA; never copy into repo/docs |
| R29 | Refund request spam or denial of service on intake | Database-backed fixed-window rate limiter (5 req / 15m) + order duplicate check blocking multiple PENDING_REVIEW records |
| R30 | Continued package downloads using old activation token after machine reset | Transactional machine reset sets all previous activations to `REVOKED`; package authorization endpoint rejects non-ACTIVE records (`ACTIVATION_NOT_FOUND`), preventing download |
| R31 | Unauthorized or frequent machine resets / license roaming | Public self-service deactivation endpoint disabled; administrative reset requires verified support ticket, reason, and enforces 90-day cooldown |

## 4. Secrets management
Keep in Vercel/host env vars (server-only), never `NEXT_PUBLIC_*`. Inventory: DB URLs, R2 keys, Ed25519 private key, payment keys/webhook secret, email API key, HMAC key (if retained). Separate staging/production values. Private signing key backed up offline in a controlled place; public key + `kid` embedded in installer builds. Access limited to named people; MFA on all provider accounts.

## 5. Licensing abuse specifics
Activation limit, revocation, anomaly alerts (many machines per key), audit of activations. Do not claim anti-piracy guarantees.
- **Licensing Boundary (C-09):** The installed MSKLC keyboard layout operates as a native Windows DLL within the operating system. It does not perform runtime license checks. Security controls enforce purchase verification, Ed25519-signed activation tokens, atomic 1-machine binding, authorized Backblaze B2 package downloads, and installation integrity verification. Once installed, OS-level driver files cannot be prevented from being manually copied by a technical user; the system does not promise unbreakable DRM.

## 6. Payment manipulation
Server-held prices; amount/currency verification; order-token not sequential; reconcile against provider daily.

## 7. Data exposure
Minimize collected data; no card data; hashed machine IDs; redact logs; admin analytics behind authentication.

## 8. Incident response and rotation
Playbooks: (1) leaked R2 key → revoke, rotate, review access logs, redeploy; (2) leaked signing key → new `kid`, ship new installer, revoke old key, force re-activation if required; (3) leaked DB credential → rotate, review; (4) packages exposed → rotate object keys/rename, invalidate URLs, notify client per NDA; (5) payment webhook secret leaked → rotate at provider. Record who to contact and notification duties in the NDA/agreement (REQUIRES CLIENT CONFIRMATION).

