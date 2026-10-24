# 16 — Handover and Support Checklist

> Evidence labels: doc 01 §0. Handover is conditioned on payment per §06.3 and §12.2 (see doc 01 §9 item 2 about sequencing relative to §04.2). Nothing is checked yet.

## 1. Handover items (§12.2: website source files, configuration documentation, project files, access credentials, other agreed deliverables)
- [ ] Source repository transferred to client-owned account; history reviewed for secrets/packages first
- [ ] Configuration documentation (docs 03, 11) updated to actual state
- [ ] Hosting/deployment access and domain/DNS access
- [ ] Supabase access; migrations and schema docs; backup/restore procedure
- [ ] Cloudflare R2 access; package upload/management procedure; bucket-private verification
- [ ] Payment gateway, email, WhatsApp provider access (client-owned accounts)
- [ ] Ed25519 key custody: private key transferred securely, backup location, rotation procedure
- [ ] Installer build and signing procedure; certificate ownership
- [ ] Environment variable list (names, purposes) — values delivered via secure channel, never in repo
- [ ] Testing evidence pack (doc 12) delivered privately
- [ ] Operational runbooks (doc 11 §10) and incident playbooks (doc 10 §8)
- [ ] Client training session / short guide: adding products & packages, handling recovery/reset requests, reading sales data
- [ ] Rotation of all credentials that KREOVI held during development, including the Backblaze key found in `doc.txt`, the old signing and HMAC secrets, and anything shared in plain text
- [ ] Client has changed the GoDaddy and Gmail passwords and enabled 2FA (they were delivered in plain text)
- [ ] `doc.txt` removed from the repository and its history (history rewrite only with approval)
- [ ] The client delivery zip and the packages are not in the repository
- [ ] The four mailboxes (navbrahmi, mahesh, naveen, support) created and tested; DNS records verified
- [ ] Invoice template defects fixed by the client; invoice numbering rule documented
- [ ] Manuals and stickers delivered to the client's storage; Oriya sticker PDF resolved
- [ ] Font licence decisions recorded (doc 13 §4)
- [ ] Removal of prototype/test data and test packages from production
- [ ] Third-party ownership/cost table acknowledged (doc 11 §12)

## 2. Final acceptance
- [ ] Project presented for review; client lists issues within 7 days (§12.1)
- [ ] In-scope defects fixed; new requests logged as additional work (§12.1, §13.2)
- [ ] Written acceptance by client (email counts per §13.4)

## 3. 30-day bug-fix support (§12.3)
**Included:** correcting bugs/technical issues directly related to agreed functionality. **Excluded:** new features; design/content changes; changes to licensing/activation requirements; third-party changes; client/third-party modifications; ongoing maintenance, security monitoring, updates; extra development. Starting point: final delivery and deployment (record the date).

## 4. Post-launch evaluation (§12.4, up to 90 days)
Parties review function and performance; website may provide available sales/analytics data incl. language-specific where supported. No guarantee of sales/revenue. Not completion criterion.

## 5. Open contractual items for the parties (not for engineering)
Payment schedule percentage/amount mismatch and the final-payment vs handover sequencing (doc 01 §9).
