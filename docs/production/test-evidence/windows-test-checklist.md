# Windows Manual Verification Checklist & Test Evidence Matrix

> **Requirement Reference**: Phase 5 Testing Requirements (§10) & docs/production/12-testing-and-acceptance-plan.md  
> **Environment Status**: Executed on Ubuntu Linux development environment. Physical Windows installation, driver registration, and Authenticode runtime checks are deferred until physical Windows hardware testing.  
> **Runtime Status**: All Windows runtime checks are marked **PENDING MANUAL WINDOWS VERIFICATION**. No Windows build or runtime results are fabricated.

---

## 1. Supported Platform Matrix & Open Decisions (C-06)

| Environment / Windows Version | Processor Architecture | Client Status (C-06) | Delivery Evidence | Test Status |
|---|---|---|---|---|
| Windows 11 (64-bit) | x64 (AMD64) | **Confirmed candidate** | Delivered in all client packages | Ready for physical Windows test |
| Windows 10 (64-bit) | x64 (AMD64) | **Confirmed candidate** | Delivered in all client packages | Ready for physical Windows test |
| Windows 11 (32-bit) | x86 (i386) | **N/A** (Win 11 is 64-bit only) | N/A | Excluded by OS architecture |
| Windows 10 (32-bit) | x86 (i386) | **Awaiting client confirmation (C-06)** | Delivered in all client packages | Pending client confirmation |
| Windows on ARM (ARM64) | ARM64 | **UNSUPPORTED / UNVERIFIED (C-06)** | **No ARM64 build delivered** | Blocked (C-06) |
| Windows Server / Itanium | ia64 | **UNVERIFIED (C-06)** | Delivered in client packages | Excluded unless explicitly requested |

---

## 2. Comprehensive Test Scenarios (12 Mandated Cases)

### Scenario 1: Clean First-Time Installation (Happy Path)
1. **Prerequisites**: Windows 11 x64 clean environment. Administrative privileges available. Valid license key issued.
2. **Action**: Run `Setup.exe`. Enter license key `NAV-XXXX-XXXX-XXXX-XXXX` and click **Install**. Accept UAC prompt.
3. **Expected Behavior**:
   - Machine identity derived (`HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid` + `System UUID`).
   - Server validates license and binds machine identity under the one-active-machine-per-license rule.
   - Server issues Ed25519 signed token (`POST /api/activation`).
   - Bootstrapper locally verifies token claims and signature.
   - Server authorizes package (`POST /api/package/authorize`), returning Backblaze B2 presigned URL and expected SHA-256.
   - Package is downloaded into temporary working directory `%TEMP%\NavBrahmi_Setup_<guid>`.
   - Local SHA-256 checksum matches database expectation.
   - Only approved fonts (C-29 whitelist) are registered; unapproved fonts are skipped.
   - Architecture-matching MSI executes silently (`/qn /norestart`).
   - Post-install verification verifies registry entry in `HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layouts`.
   - Layout is switchable via **Win + Space**.
   - Activation token saved in `%ProgramData%\NavBrahmi\activation.token`.
   - Temporary directory is deleted upon exit.

### Scenario 2: Offline / Network Interruption During Download
1. **Action**: Start installation; disconnect network adapter while download is in progress (between 10% and 40%).
2. **Expected Behavior**:
   - Bootstrapper catches network timeout/failure and retries up to 3 times with exponential backoff.
   - On final retry failure, displays clear error message: `"Failed to download driver package after 3 attempts. Please check your internet connection."`
   - Temporary download artifacts in `%TEMP%\NavBrahmi_Setup_<guid>` are completely purged.
   - Machine binding remains intact on server; no second activation slot is consumed when network resumes.

### Scenario 3: Tampered Package Bytes / Hash Mismatch
1. **Action**: Simulate a MITM proxy or corrupted transfer where 1 byte of the downloaded `.zip` is modified.
2. **Expected Behavior**:
   - Local SHA-256 computation detects mismatch against authoritative database hash.
   - Bootstrapper logs warning (with redacted paths) and immediately deletes the downloaded file.
   - Installation aborts with exit code 1.
   - MSI is never executed; no corrupted binaries are registered into `C:\Windows\System32`.

### Scenario 4: Expired Presigned Download URL
1. **Action**: Pause execution for >15 minutes (900 seconds) after receiving presigned URL from `/api/package/authorize`, then attempt download.
2. **Expected Behavior**:
   - Backblaze B2 returns HTTP 403 Forbidden (`Request has expired`).
   - Bootstrapper catches HTTP 403, requests a fresh presigned URL via token authorization, and retries.
   - If token itself is expired, prompts user to re-authenticate cleanly.

### Scenario 5: Re-running on Same Machine (Idempotent Re-install)
1. **Action**: Run `Setup.exe` on a machine that has already completed installation.
2. **Expected Behavior**:
   - Server recognizes existing machine binding and re-issues token without error (idempotent).
   - Package downloads and verifies.
   - MSI executes with `/qn /norestart` and returns exit code `1638` (Another version is already installed).
   - Bootstrapper evaluates exit code `1638` by verifying installed registry keys.
   - If keyboard layout is present in registry, treats as SUCCESS; reports `"Keyboard layout driver already installed and verified."`

### Scenario 6: User Cancellation at UAC Prompt
1. **Action**: Run `Setup.exe`, click **Install**, and click **No / Cancel** on the Windows User Account Control (UAC) elevation prompt.
2. **Expected Behavior**:
   - Setup catches process elevation denial (Win32 error `ERROR_CANCELLED` / exit code 1603).
   - Displays clear message: `"Administrator elevation was declined. Setup requires administrative rights to register keyboard drivers."`
   - All temporary files in `%TEMP%` are deleted.
   - No half-installed registry entries or dangling files remain.

### Scenario 7: Non-Administrator Standard User Execution
1. **Action**: Run `Setup.exe` from a standard, non-elevated user account without administrative rights.
2. **Expected Behavior**:
   - Bootstrapper requests elevation via `Verb = "runas"`.
   - If credential prompt is approved by admin, system-wide install succeeds.
   - If elevation is refused or unavailable, setup aborts cleanly with descriptive error.

### Scenario 8: Second Machine Activation (One-Machine Policy Enforcement)
1. **Action**: Attempt activation on Machine B using a license key already bound to Machine A.
2. **Expected Behavior**:
   - Backend queries database under row lock; finds active binding with differing machine hash.
   - Backend returns HTTP 403 with code `ACTIVATION_LIMIT_REACHED`.
   - Bootstrapper displays: `"This license has reached its maximum activation limit (1 machine). Please contact support to transfer or purchase an additional license."`
   - Server does NOT leak the machine hash of Machine A.
   - No package authorization or download occurs on Machine B.

### Scenario 9: Cloned Virtual Machine / Hardware Change
1. **Action**: Activate on VM-A, clone VM-A to VM-B (new System UUID and MachineGuid), attempt activation on VM-B.
2. **Expected Behavior**:
   - Bootstrapper derives unique machine hash from VM-B hardware/OS identifiers.
   - Server detects machine hash mismatch against existing binding for that license.
   - Activation is rejected under C-07 rules until deactivation/replacement policy is confirmed.

### Scenario 10: Unsupported Architecture Rejection
1. **Action**: Run bootstrapper on Windows on ARM (ARM64) or unsupported 32-bit platform (if C-06 restricts).
2. **Expected Behavior**:
   - Bootstrapper checks native OS architecture via `IsWow64Process2` / environment variables.
   - Detects `arm64` or unsupported architecture.
   - Aborts immediately before network activation: `"This driver currently supports Windows x64. ARM64 is not supported."`
   - Server package authorization also validates architecture and returns HTTP 400 `ARCH_NOT_SUPPORTED` if requested.

### Scenario 11: Post-Install Registry & Keyboard Layout Verification
1. **Action**: Complete MSI execution (exit code 0 or 1638).
2. **Expected Behavior**:
   - Bootstrapper inspects `HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layouts\<LayoutId>`.
   - Verifies `Layout File` points to installed `.dll` in `C:\Windows\System32`.
   - If registry key is missing, installation is flagged as FAILED even if MSI returned 0.
   - Confirms layout appears in Windows Language Bar / Input Switcher.

### Scenario 12: Cleanup After Failure in All Paths
1. **Action**: Induce failures at various points: invalid license, network disconnect, hash mismatch, MSI failure, and user abort.
2. **Expected Behavior**:
   - In all failure paths, `finally` blocks guarantee `%TEMP%\NavBrahmi_Setup_*` is wiped.
   - In-memory keys and tokens are cleared from process memory.
   - No orphaned files, downloaded zips, or temporary scripts remain on disk.

---

## 3. Results Table Template

| Test ID | Test Scenario | Target Environment | Arch | Test Date | Expected Outcome | Actual Outcome | Evidence Location | Status |
|---|---|---|---|---|---|---|---|---|
| **WIN-01** | Clean First-Time Installation | Windows 11 23H2 | x64 | Deferred | Layout switchable via Win+Space | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-02** | Offline Interruption During Download | Windows 11 23H2 | x64 | Deferred | 3 retries, backoff, clean abort & cleanup | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-03** | Tampered Package Bytes | Windows 11 23H2 | x64 | Deferred | Local hash mismatch, file deleted, no MSI exec | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-04** | Expired Presigned Download URL | Windows 11 23H2 | x64 | Deferred | HTTP 403 caught, fresh URL obtained or clean abort | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-05** | Re-running on Same Machine | Windows 11 23H2 | x64 | Deferred | Idempotent token, MSI 1638 handled, layout verified | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-06** | Cancellation at UAC Prompt | Windows 11 23H2 | x64 | Deferred | Elevation error caught, temp directory wiped | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-07** | Non-Administrator User Execution | Windows 11 23H2 | x64 | Deferred | UAC prompt shown; clean error if refused | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-08** | Second Machine Activation | Windows 11 23H2 | x64 | Deferred | HTTP 403 limit reached, no leakage of Machine A | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-09** | Cloned Virtual Machine | Windows 11 23H2 (Hyper-V) | x64 | Deferred | Machine hash mismatch rejected | Awaiting Windows hardware | `docs/production/test-evidence/` | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-10** | Unsupported Architecture (ARM64) | Windows 11 on ARM | ARM64 | Deferred | Clean early rejection before activation | Awaiting ARM64 hardware | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-11** | Post-Install Registry Verification | Windows 11 23H2 | x64 | Deferred | Registry entry confirmed; Win+Space verified | Awaiting Windows hardware | **PENDING MANUAL WINDOWS VERIFICATION** |
| **WIN-12** | Cleanup After Failure in All Paths | Windows 11 23H2 | x64 | Deferred | `%TEMP%` wiped across all abort/error paths | Awaiting Windows hardware | **PENDING MANUAL WINDOWS VERIFICATION** |
