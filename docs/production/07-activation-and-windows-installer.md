# 07 — Activation and Windows Installer

> Evidence labels: doc 01 §0. As-found facts are VERIFIED IN REPOSITORY (doc 02 §6) or CLIENT-SUPPLIED (package metadata). Production behavior is **PROPOSED DESIGN**.

## 1. As-found installer (VERIFIED IN REPOSITORY)
A C# WinForms/console bootstrapper (.NET Framework 4, AnyCPU, `asInvoker`) plus a PowerShell/batch alternative. Findings F-12 to F-17 in doc 02 apply. Do not rely on the prototype's installer security claims; several are not evidenced (offline token verification) or ineffective (embedded HMAC).

## 2. What the client's packages actually are (CLIENT-SUPPLIED)
Each of the 14 products is a **Keyboard Layout Creator (MSKLC) 1.4** output: MSIs for **amd64, i386 and ia64**, matching native layout DLLs (plus a WOW64 DLL), and MSKLC's stock `setup.exe`. **No ARM64 build exists.** Product folders also contain fonts, a manual PDF and a sticker.
- ia64 is Itanium; whether to ship it at all is the client's call (C-06).
- Windows-on-ARM support is **unverified**; the prototype assumes ARM64 can use the amd64 MSI (F-13). Do not keep that assumption unless it is tested on real ARM hardware.
- The manuals state no minimum Windows version. The prototype manifest says Windows 10/11; the README says Windows 11. Client must state supported versions (C-06).
- The client's stock `setup.exe` is separate from our bootstrapper. PROPOSED: our bootstrapper selects and runs the correct MSI itself; the client's `setup.exe` and unused-architecture files are not delivered to customers. Do not modify the client's MSIs/DLLs.

## 3. Production flow (PROPOSED)
1. Installer starts with an embedded, **server-signed** payload (backend URL, a short-lived download/authorization token). No license key in URLs or query strings.
2. Detect OS architecture explicitly (native, not process): x64, x86; anything else (ia64, ARM64 unless approved and tested) → clear "unsupported" message; never "first MSI found".
3. Compute machine ID hash (MachineGuid + System UUID) — keep the existing recipe unless audit of real hardware shows defects.
4. Call a single **activate** endpoint: validates license/product/status/rules, binds atomically, returns a signed activation token.
5. Call **package-authorize** with the token: server selects the ProductPackage for product + architecture and returns a presigned R2 URL, expected SHA-256 and size from the **database**.
6. Download with timeout and limited retries; verify SHA-256; on mismatch delete and abort.
7. Install only what the package intends: run the architecture's MSI; fonts per §6.
8. Post-install check (layout present in the system, font present) before reporting success; treat MSI 1638 ("already installed") as "already installed", not as a new success; report accurate error codes.
9. Report result to the server (optional telemetry, no secrets); remove temp files on success, failure and cancel.

## 4. Activation rules
Existing: one machine per license forever, no reset, race on first bind, 403 leaks the bound machine hash (F-11).  
**CONFIRMED PROJECT DECISION (2026-10-24)**: **One active machine per license** (C-07).
- First valid activation binds the license to the machine.
- Repeated activation on the same machine is idempotent.
- A different machine is rejected when the license is already bound (`ACTIVATION_LIMIT_REACHED`), without leaking the bound machine hash.
- Enforced atomically using PostgreSQL row-level locks (`SELECT FOR UPDATE`) within Prisma `$transaction`.
- Machine replacement, reset, and deactivation remain separate unresolved client decisions. Deactivation endpoint explicitly returns HTTP 400 `DEACTIVATION_POLICY_UNCONFIRMED` until client policy is finalized.

## 5. Activation token (Ed25519)
Existing: signing works, but the **default private key is in the source** (F-01) and the installer never verifies tokens (F-12). Production (PROPOSED): generate a **new** key pair; private key only in server environment; token claims: token id, license id, product id, machine hash, issued-at, expiry, `kid`; the server verifies the token on package-authorize; if the installer or any later component needs offline verification, embed the public key with `kid` and implement verification there; short expiry for download authorization; key rotation supported. The existing 1-year token containing the license key in clear should be redesigned to omit the key.

## 6. Embedded payload and HMAC — redesign
Existing: payload appended to the exe; HMAC key is a constant inside the exe and in source; unsigned payloads are accepted (F-02, F-16). A secret inside a client binary protects nothing. PROPOSED: authenticate with a **server-issued signed token** (asymmetric signature verified with the embedded public key, or simply an opaque random token checked server-side); reject payloads with no valid proof; keep all authorization decisions on the server.

## 7. Package selection, download and verification
Per-architecture ProductPackage rows (PROPOSED), each a private object in R2 containing that architecture's MSI plus the product's fonts. Server returns the package for the activation's architecture. Unknown product or architecture → error, never fallback (F-08). SHA-256 from the database.

## 8. Fonts
Existing installer copies every `.ttf` to the system fonts folder (F-15). Production: install only fonts the client has confirmed **and** whose licences permit redistribution (C-29); handle `.otf` if any are included; per-user vs system install per privileges; record installed fonts for uninstall/support. Noto families are published under open licences (verify per file); several others in the delivery (for example the Grantham family and `grantha-sangam-mn`) have unknown licences, and one name matches an Apple font — verify before any redistribution.

## 9. Error handling, cleanup, outages
Every failure → readable message + error code. Install failing after activation: activation stays recorded; re-run on the same machine does not consume another activation. Backend/storage outage → retry with backoff, then a clear message. Temp folder removed on all exits (existing `finally` cleanup is a good base).

## 10. Supported Windows environments
Not decided. Candidates in the evidence: Windows 10/11 (manifest), Windows 11 (README). Architectures delivered: x64, x86, ia64. **C-06.** Test on every confirmed combination with clean VMs.

## 11. Does the installed product enforce licensing?
The delivered products are standard MSKLC keyboard layouts: the installed DLL maps keys to characters and has no licensing hook. After installation the software works whether or not a license was ever activated, and anyone holding an MSI can install it. **Protection therefore applies to authorized download and installation only.** Agreement §08.1 mentions "driver integration mechanisms" and §02.4/§08.2 disclaim absolute protection; the client should acknowledge this limit in writing (C-09). Adding a check to the layout would require changing the client's binaries, which is not authorized.

## 12. Signing and distribution
Existing signing script falls back to a self-signed demo certificate (not trusted by Windows). Production: client-owned code-signing certificate (C-19); store it outside the repo; sign the final binary. The prototype appends a payload after signing (F-17): either deliver the payload separately (for example in a small signed token file or via the download URL) or test that signature validity and SmartScreen behavior survive the append. Document the build and signing steps.

## 13. Limitations
Installer-only protection can be bypassed by sharing downloaded packages or MSIs, patching the installer, or copying installed files. Do not promise otherwise (§08.2, §08.3).

## 14. Phase 5 Implementation & Verification Evidence (VERIFIED IN REPOSITORY & BY TEST)

- **Ed25519 Token Signing & Canonical Contract (Task 2):**
  - Canonical token payload standard established across server and installer:
    - Primary claims: `tid` (Token ID), `lid` (License ID), `pid` (Product ID), `mch` (Machine hash), `iat` (Issued at unix timestamp), `exp` (Expiry unix timestamp), `kid` (Key ID), plus compatibility aliases (`jti`, `lic`, `prd`).
    - Format: `base64url(payloadJson) + "." + base64url(64_byte_ed25519_signature)`.
    - Signed message: UTF-8 encoded bytes of `base64url(payloadJson)`.
    - Key rotation supported via `kid` matching in server and installer trusted key store.
  - Implemented in `src/lib/keys.ts` and `src/app/api/activation/route.ts` and `src/app/api/package/authorize/route.ts`.
  - Zero private keys in installer; public key rotation registry embedded in bootstrapper.
  - Embedded zero-dependency pure RFC 8032 Ed25519 verifier in C# bootstrapper (`Ed25519Verifier` using `System.Numerics.BigInteger` and SHA-512) and documented official `BouncyCastle.Cryptography` reference package.
  - Verified by tests in `tests/unit/keys.test.ts` and cross-language interoperability tests in `tests/unit/installer-bootstrapper.test.ts`.

- **Atomic Machine Activation (Task 1):**
  - Implemented in `src/app/api/activation/route.ts` and `src/app/api/license/activate/route.ts`.
  - Uses PostgreSQL row-level locking (`SELECT FOR UPDATE`) within Prisma `$transaction` to eliminate race conditions on first bind (F-11 remediation).
  - Validates license status, product match, expiration, and activation limits without leaking bound machine IDs on rejection.
  - Verified by tests in `tests/integration/activation-api.test.ts` (including 10 concurrent requests from competing machines).

- **Telemetry & Deactivation Policy Enforcement (Task 1):**
  - Installation telemetry reported to `src/app/api/activation/report/route.ts` with structured redaction.
  - Deactivation endpoint `src/app/api/license/deactivate/route.ts` explicitly returns HTTP 400 Bad Request with `DEACTIVATION_POLICY_UNCONFIRMED` per C-07 until client confirms policy.

- **Two-Step Package Authorization via Backblaze B2 (Task 3):**
  - Implemented in `src/app/api/package/authorize/route.ts` and `src/app/api/package-authorize/route.ts`.
  - Verifies Ed25519 token signature, token expiration, license status, and matching machine ID before querying `ProductPackage`.
  - Generates 15-minute presigned B2 URL capped at 900 seconds.
  - Blocks unknown products or architectures without fallback (F-08 remediation).
  - Enforces C-06 supported architectures (`x64`, `x86`) and rejects unapproved architectures.
  - Verified by tests in `tests/integration/package-authorization.test.ts`.

- **Package Registration & B2 Storage Verification (Task 3 & 4):**
  - Verified private B2 bucket `navbrahmi-prod-packages` on `s3.us-east-005.backblazeb2.com` (not Velero or backup).
  - Cleaned up synthetic test objects.
  - Registered 20 real client packages for 10 authoritative products (`x64` and `x86`), with byte-for-byte SHA-256 and size verification against local archives.
  - Documented 3 ambiguous categories (Kannada/Tulu, Tamil/Tamil Grantha, Tulu) blocked by client decision C-03 (pending single vs separate product confirmation).
  - Integration verified in `tests/integration/storage-integrity-b2.test.ts` (upload/download, SHA check, tampering, presigned expiry, unauthorized direct access rejection, listing restrictions).

- **Hardened Windows Bootstrapper & Persistent Font Installation (Task 1 & 5):**
  - Refactored `Requirements/windows-driver/bootstrapper/Program.cs`:
    - Enforces HTTPS for all remote endpoints (F-07 remediation).
    - Detects native OS architecture via `GetNativeSystemInfo` (rejects unapproved platforms; F-13 remediation).
    - Performs two-step flow: activates license, receives token, requests package URL with token + machine hash.
    - Implemented local token claims validation `VerifyActivationTokenLocally` using RFC 8032 Ed25519 public key verification.
    - Computes and verifies SHA-256 against server-returned database hash before running MSI; aborts and purges file on mismatch.
    - Enforces explicit font allowlist: strictly `navbrahmi-regular.ttf` and `navbrahmi-bold.ttf` (no wildcard or extension enumeration).
    - Persistent font installation: Admin copies to `%WINDIR%\Fonts` and writes `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts`; Non-admin copies to `%LOCALAPPDATA%\Microsoft\Windows\Fonts` and writes `HKCU\Software\Microsoft\Windows NT\CurrentVersion\Fonts`. Calls `AddFontResourceW` (strictly without `FR_PRIVATE` 0x10) and broadcasts `WM_FONTCHANGE`. Full rollback/cleanup on uninstall or failure.
    - Evaluates MSI exit code 1638 ("another version already installed"): requires post-install registry verification of `Layout File` in `HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layouts` before reporting success.
    - Verifies post-installation presence of layout DLL/registry before reporting success (F-14 remediation).
    - Structured telemetry and guaranteed temp directory cleanup in `finally` block.
  - Unit tests verified in `tests/unit/installer-bootstrapper.test.ts` (architecture detection, HTTPS enforcement, Authenticode overlay analysis, font allowlist filtering, persistent font installation without FR_PRIVATE, MSI 1638 / registry evaluation, local token validation).
  - Note: Windows compilation and live runtime verification are deferred to Windows hardware and tracked in `docs/production/test-evidence/windows-test-checklist.md` as **PENDING MANUAL WINDOWS VERIFICATION**.

- **Authenticode Overlay Analysis & Findings (Task 6):**
  - Investigation documented in `tests/unit/installer-bootstrapper.test.ts`: Appending payload to signed PE executable alters authenticode digest outside attribute certificate table. Under MS13-098 / CVE-2013-3900 (`EnableCertPaddingCheck`), `WinVerifyTrust` fails with `TRUST_E_BAD_DIGEST` (0x80096010). Binary must be signed after packaging or payload delivered separately. Client code-signing certificate (C-19) required for production release.

## 15. Official Documentation Citations
- **Backblaze B2 S3-Compatible API**: [https://www.backblaze.com/docs/cloud-storage-s3-compatible-api](https://www.backblaze.com/docs/cloud-storage-s3-compatible-api)
- **Backblaze Presigned URLs**: [https://www.backblaze.com/docs/cloud-storage-presigned-urls](https://www.backblaze.com/docs/cloud-storage-presigned-urls)
- **Resend API & Domain Verification**: [https://resend.com/docs/dashboard/domains](https://resend.com/docs/dashboard/domains)
- **Microsoft Authenticode & MS13-098 Security Bulletin**: [https://learn.microsoft.com/en-us/security-updates/securitybulletins/2013/ms13-098](https://learn.microsoft.com/en-us/security-updates/securitybulletins/2013/ms13-098)
- **Microsoft Windows Installer (MSI) Error Codes**: [https://learn.microsoft.com/en-us/windows/win32/msi/error-codes](https://learn.microsoft.com/en-us/windows/win32/msi/error-codes)
- **Prisma Transactions & Row Locking**: [https://www.prisma.io/docs/orm/prisma-client/queries/transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- **Node.js Crypto AES-256-GCM**: [https://nodejs.org/api/crypto.html#ccm-mode-and-gcm-mode](https://nodejs.org/api/crypto.html#ccm-mode-and-gcm-mode)

