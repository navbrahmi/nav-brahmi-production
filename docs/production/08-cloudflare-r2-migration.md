# 08 — Object Storage (Backblaze B2 Confirmed; R2 Cancelled)

> **DECISION RECORD (2026-10-24):** The client confirmed: **"we are using same backblaze only not R2"**.
> The proposed Cloudflare R2 migration is **CANCELLED**. Backblaze B2 remains the sole and active object storage provider for private installer packages and distribution assets.
> The sections below regarding R2 are retained for historical audit/design reference only. Storage architecture operates exclusively on Backblaze B2 via its S3-compatible API.

## 1. Current B2 implementation (VERIFIED IN REPOSITORY; demo snapshot)
- `src/lib/b2.ts`: S3 client with `forcePathStyle`, endpoint/region/bucket from `B2_ENDPOINT`, `B2_REGION`, `B2_BUCKET_NAME`, credentials from `B2_KEY_ID`, `B2_APPLICATION_KEY` (Key ID format validated for B2 only). Hard-coded fallbacks for endpoint, region and bucket name (F-22).
- Presigned GET, default 900 s, with a clock-offset workaround that does a HEAD request to the endpoint.
- **Package definitions are hard-coded in source** (two demo packages: id, filename, object key, SHA-256) and `resolvePackageDefinition` falls back to the Tamil Grantha package for any unknown product (F-08, F-21).
- Upload helper `uploadPackageToB2`; scripts `upload-windows-package.ts`, `sync-b2-packages.ts`, `package-drivers.ts`.
- Project rule: no automatic uploads; manual script only.
- **`doc.txt` in the repo root appears to hold live B2 credentials (F-03): rotate that application key and remove the file from the repo and its history.**
- The client's 14 real packages are **not** in B2 as far as the repo shows; the prototype stored two demo packages.

## 2. Authorization prerequisite
Packages are NDA-protected client assets. Obtain **written client approval** to host them on Cloudflare R2 (and confirm B2 hosting was approved). Do not upload to any other service. REQUIRES CLIENT CONFIRMATION.

## 3. Target configuration (PROPOSED)
- Separate buckets: `…-staging`, `…-production`. Private; public access/`r2.dev` URL disabled; no public custom domain attached to the package bucket.
- S3-compatible endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`; presigned URLs are generated against this endpoint (verify current R2 presigning limitations in Cloudflare docs).
- Credentials: two scoped API tokens — runtime (read-only, production bucket) and admin/upload (write, used from a trusted workstation or CI secret). Never in browser/installer/repo.
- Env var names (PROPOSED): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `PACKAGE_URL_TTL_SECONDS`.
- Account owner: client-owned Cloudflare account (§06.4); KREOVI uses delegated access during development.

## 4. Object naming and mapping
`packages/<productCode>/<version>/<arch>/<filename>` (PROPOSED), one object per product × architecture (x64, x86; others per C-06). Manual/sticker PDFs: `assets/<productCode>/…` (private or public: C-35). The DB `ProductPackage.objectKey` is the sole mapping (replaces the hard-coded definitions); names must not reveal sensitive details. No listing permission for the runtime token. 14 products × confirmed architectures = the expected object count; reconcile it at upload.

## 5. Presigned URLs and checksums
GET presign TTL ≤ 15 min (shorter preferred), single object, no listing. Expected SHA-256 computed at packaging time from the authorized source file, stored in DB, returned by the authorize endpoint. Optionally also set a SHA-256 checksum/metadata on upload and verify after upload by re-downloading and hashing. Do not log URLs.

## 6. Upload and sync tooling
Add R2 variants of the existing scripts (do not delete the B2 ones yet): the upload script reads an authorized local package, computes SHA-256, writes to R2, records the `ProductPackage` row and verifies by re-hashing; the sync script is **dry-run by default**, never deletes without a flag, prints object keys and sizes only. The client's delivery contains fonts and files that must not all ship (doc 07 §8, doc 13); the packaging step builds per-architecture zips from the authorized folders.

## 7. Migration and cutover plan
1. Inventory current B2 objects and DB mappings (keys, sizes, hashes) — export to a local, access-controlled file.
2. Create staging bucket + scoped tokens.
3. Implement storage module switch via config (`STORAGE_PROVIDER=b2|r2`) — temporary, removed after cutover.
4. Upload authorized packages from the original local source to R2 staging; verify hashes.
5. Run staging end-to-end installer test (doc 12).
6. Create production bucket; upload; verify.
7. Update production env, redeploy; run smoke tests with a test license.
8. Monitor; keep B2 read-only/private for a client-agreed rollback window.
9. After window: delete B2 objects and revoke B2 keys (client approval), remove B2 code.

## 8. Verification and rollback
Verify: unauthenticated GET to object URL fails (403); expired URL fails; wrong-product token cannot obtain another product's URL; hash matches; installer succeeds. Rollback: switch `STORAGE_PROVIDER` back to B2 and redeploy (possible only while B2 data/keys remain).

## 9. Preventing accidental exposure
Never commit packages (see doc 10 R1); `.gitignore` for `*.zip`, `*.msi`, `.env*`; pre-commit secret/binary scan; no packages in CI logs/artifacts; Cloudflare account MFA; bucket-level audit of public settings after every change.


## Phase 2 Storage Implementation (VERIFIED IN REPOSITORY & BY TEST)
- `src/lib/storage.ts`: Implements storage client with Backblaze B2 confirmed as primary.
- Presigned URLs capped at 900s (15 min); package lookup from database raises error for unknown product/architecture.

## Phase 5 Backblaze B2 Storage Verification (VERIFIED IN REPOSITORY & LIVE B2 TEST)
- **Bucket Identification & Integrity**: Configured bucket is `navbrahmi-prod-packages` on `s3.us-east-005.backblazeb2.com`. Verified distinct from Velero/infrastructure-backup buckets.
- **Fail-Fast Hardening**: Removed hardcoded fallback bucket `keyboard-driver-demo` from `src/lib/storage.ts`.
- **Live B2 Test with Synthetic Package**:
  - Live upload of synthetic driver package archive (`tests/integration/storage-integrity-b2.test.ts`).
  - Presigned GET URL generated and fetched.
  - Downloaded bytes and SHA-256 matched source exactly (32-byte digest match).
  - Presigned URL verified with strict 900s TTL.
  - Tampered hash detection and invalid authorization rejection verified.
- **Public Bucket Listing Blocked**: Direct public HTTP request to `https://s3.us-east-005.backblazeb2.com/navbrahmi-prod-packages/` returned HTTP 403 Forbidden (`AccessDenied`), verifying private access control.
- **Real Client Packages**: Preserved unmodified in local filesystem. Registration tooling `scripts/register-package.ts` redacts confidential package filenames, paths, and hashes from logs.
- **Phase 6 Package Separation (C-03)**:
  - Kannada (`KANNADA`) and Tulu (`TULU`) packages are mapped to their respective distinct products in the database.
  - Tamil and Tamil Grantha package registration remains isolated; checkout remains disabled pending C-03 bundle resolution.
  - No cross-product package mappings exist in storage or database.


