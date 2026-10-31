# Comprehensive Placeholder and Client-Input Inventory

> **Document Type**: Internal Master Inventory & Pre-Production Audit  
> **Repository Branch**: `phase-5-activation-download-installer-recovery`  
> **Status**: Comprehensive scan across documentation, schema, APIs, frontend content, email templates, and Windows bootstrapper.  
> **Confidentiality Notice**: Strictly excludes secret credentials, `.env` values, and proprietary package filenames, full paths, or file hashes.

---

## Executive Summary

Before the Nav Brahmi software delivery pipeline and e-commerce website can proceed to production release and accept live payments, all outstanding client inputs, business policies, legal disclosures, and unresolved placeholders must be reconciled. 

This inventory audits **every open client input, code placeholder, and configuration gap**, categorized into the 12 mandated production domains. For each item, it documents the known evidence, the exact missing value, the responsible party, the governing decision ID (`C-xx` from [14-client-inputs-and-open-decisions.md](file:///home/projects/projects/Ujwal/nav-brahmi-production/docs/production/14-client-inputs-and-open-decisions.md)), and the release impact.

---

## 1. Product and Package Data

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-01** | Official sellable catalog scope (Kannada/Tulu confirmed; Tamil/Grantha pending) | Client confirmed Kannada and Tulu are separate products. Tamil & Tamil Grantha grouping remains unconfirmed. | Client confirmation whether Tamil and Tamil Grantha are sold together or separately. | Client | C-03 | **RESOLVED FOR KANNADA & TULU**: Kannada (`KANNADA`) and Tulu (`TULU`) active as separate products. Tamil & Tamil Grantha withheld from checkout (`isCheckoutAllowed: false`) until bundling confirmed. |
| **INVENTORY-02** | Kharoshthi package classification | Package exists only in historical prototype; not listed in agreement or client delivery files. | Confirmation that Kharoshthi was prototype-only demo and should remain excluded from production catalog. | Client | C-04 | Low; Kharoshthi is currently excluded from product seeds. |
| **INVENTORY-03** | Canonical package naming and internal duplicates | Package inspection revealed Kannada installer copy inside Malayalam fonts directory and shared build dates. | Client verification that delivered packages in `Requirements/Software/` are the final canonical release masters. | Client | C-36 | Quality assurance; ensures exact intended binary is installed for each language. |

---

## 2. Pricing and Tax

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-04** | Confirmed retail price per package (₹472.00) | Client confirmed retail price is **₹472.00 per language package** (47200 paise). | None for retail price. Status: **CONFIRMED & ENFORCED** (C-02). GST breakdown details pending C-13/C-34 meeting. | Client / Accountant | C-02 | **RESOLVED**: Retail price locked at ₹472.00 (47200 paise) across products, checkout, and UI. No automatic 18% GST added. Razorpay kept in TEST mode. |
| **INVENTORY-05** | Multi-product bundle pricing and discounts | Agreement mentions `"Language-specific purchasing pages"`; no multi-product cart or bundle discount rules defined. | Confirmation whether multi-product purchases, educational discounts, or all-language bundles are offered. | Client | C-30 | Medium; current system enforces one product per checkout transaction. |

---

## 3. Licensing and Activation

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-06** | Machine activation limit rule | Confirmed by client: **One active machine per license**. | None for limit (confirmed as 1). Status: **CONFIRMED & ENFORCED**. | Client / Developer | C-07 | Implemented via database row lock and `maxActivations: 1`. |
| **INVENTORY-07** | Machine replacement and deactivation policy | Confirmed: Customer cannot self-deactivate from website. Support-assisted reset workflow with 90-day cooldown implemented in CLI. | Client approval of recommended 90-day cooldown rule. | Client | C-07 | **IMPLEMENTED**: Restricted server-side administrative CLI (`scripts/admin-machine-reset.ts`) enforces 90-day cooldown, admin override, previous binding revocation, and token invalidation. Customer self-service endpoint disabled. |
| **INVENTORY-08** | Licensing boundary and protection scope | Confirmed: MSKLC keyboard layouts install native `.dll` files into `C:\Windows\System32` without runtime DRM. | None. Status: **CONFIRMED & DOCUMENTED** (C-09). Protection scoped to purchase, license generation, 1-machine activation, package download, installer authorization, installation reporting. Client binaries unmodified. | Client | C-09 | **RESOLVED**: Contractual and technical protection boundaries documented accurately across website, FAQ, and technical architecture. |
| **INVENTORY-09** | Offline customer support and lost-email recovery | Automated email recovery handles customers with active purchase emails. | Standard Operating Procedure (SOP) for customers who lost email access: What proof of purchase (bank statement, Razorpay ID) is required? | Client | C-10 | Support operations; manual support path via `support@brahmicomputing.in`. |

---

## 4. Windows and Architecture Support

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-10** | Supported Windows versions & architecture policy | Recommended supported target: **Windows 11, 64-bit x64 systems (Intel/AMD)** within servicing lifecycle. Unsupported: ARM64, 32-bit Windows, Windows 10, Windows 11 S mode. | Formal client sign-off on recommended policy. Status: **IMPLEMENTED & DOCUMENTED** (C-06). | Client | C-06 | Product compatibility, FAQ, instructions, and bootstrapper architecture checks updated. Windows hardware tests marked PENDING MANUAL WINDOWS VERIFICATION. |
| **INVENTORY-11** | Minimum supported Windows OS build | Windows 11 64-bit x64 within Microsoft servicing lifecycle. | None. Standard Microsoft lifecycle applies. | Client | C-06 | Displayed on product pages and system requirements table. |

---

## 5. Fonts and Installation Behavior

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-12** | Font ownership & product-specific font mapping | Client confirmed: Brahmi Computing Technologies owns/redistributes delivered fonts. Required fonts are located in respective language folders. | None. Status: **CONFIRMED & IMPLEMENTED** (C-29). Product-specific font manifest (`src/lib/font-manifest.ts`) and bootstrapper mapping enforce explicit font selection without wildcards or cross-language mixing. | Client | C-29 | **RESOLVED**: Product-specific font manifest and persistent Win32 registration without `FR_PRIVATE` implemented. Windows runtime verification remains pending. |
| **INVENTORY-13** | OpenType (.otf) font support | Tamil Grantha package contains 2 `.otf` files; bootstrapper `.ttf` filter currently skips `.otf` files. | Client decision: Should installer register `.otf` fonts, or should only standard TrueType (`.ttf`) fonts be supported? | Client | C-39 | Bundled with Tamil Grantha resolution. |
| **INVENTORY-14** | Font installation scope (System-wide vs Per-user) | Windows 10/11 supports per-user font installation; System-wide font installation requires `HKLM` and UAC admin elevation. | Client confirmation: Should fonts install system-wide (`C:\Windows\Fonts`) requiring admin elevation, or per-user? | Client | C-29 | Installer implements dual mode: HKLM for admin, HKCU for standard user, both using persistent `AddFontResourceW` without `FR_PRIVATE`. |

---

## 6. Business Contact and Customer Support

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-15** | Official customer support contact details | Client confirmed: Phone `9632819063`, Email `support@brahmicomputing.in`. | None for phone and email. Status: **CONFIRMED & UPDATED** (C-10, C-17). Official media remains pending. | Client | C-10, C-17 | **RESOLVED**: Phone and email updated across website, footer, emails, contact page, and order views. No invented office hours or addresses. |
| **INVENTORY-16** | Registered physical business address | Multiple addresses appear across visiting card, agreement header, and invoice template. | Official registered business address for legal footer, invoice headers, and Razorpay business verification. | Client | C-17, C-34 | Required for consumer protection compliance and payment gateway verification. |
| **INVENTORY-17** | Customer support hours and SLA | FAQ states support is available; hours are not defined. | Official working hours (e.g., Monday–Friday 9:30 AM – 6:00 PM IST) and support response SLA. | Client | C-17 | Customer transparency; prevents unrealistic support expectations. |

---

## 7. Legal, Refund, and Customer-Facing Policy

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-18** | Digital software refund policy | Client confirmed: Customer may apply within 7 calendar days of installation for serious bug or functional defect. All requests manually reviewed by support; refunds are not automatic. | None for intake policy. Status: **CONFIRMED & IMPLEMENTED** (C-08, C-18). | Client / Legal | C-08, C-18 | **RESOLVED**: Intake endpoint `/api/orders/[token]/refund-request` implemented with 7-day window from `installedAt`, rate limiting, duplicate blocking, `PENDING_REVIEW` status, and Resend outbox alert to support. Zero automatic refunds or revocations. |
| **INVENTORY-19** | Terms & Conditions and Privacy Policy texts | Basic placeholder structure exists; formal legal texts for software licensing, data privacy (DPDP Act 2023 compliance), and liability limits are missing. | Client-approved legal text for Terms of Service and Privacy Policy. | Client / Legal | C-18 | **HARD GATE FOR RAZORPAY LIVE ACTIVATION**. |
| **INVENTORY-20** | End User License Agreement (EULA) | Agreement mentions proprietary software licensing; no standalone EULA text provided for installer dialog or download page. | Formal EULA text governing Nav Brahmi driver usage, restrictions on decompilation, reverse engineering, and redistribution. | Client / Legal | C-18 | Included in installer bootstrapper and order confirmation page. |

---

## 8. Email and Delivery Configuration

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-21** | Resend DNS verification status | Verified via dashboard screenshot: domain `brahmicomputing.in` is fully verified with DKIM, SPF, and MX records. Status: **VERIFIED**. | None for domain DNS. | Client / Provider | C-11, C-12 | DNS verification complete; default sender `Nav Brahmi <support@brahmicomputing.in>` configured. |
| **INVENTORY-22** | Official contact form destination mailbox | Contact page submits messages; needs active destination mailbox to forward customer inquiries. | Confirmation of recipient mailbox for website contact form (e.g., `support@brahmicomputing.in` or `naveen@brahmicomputing.in`). | Client | C-12 | Contact form routing. |
| **INVENTORY-23** | Customer notification email copies / CC | Business owner may want order notification copy. | Confirmation whether order confirmation emails should BCC an internal sales inbox (e.g. `sales@brahmicomputing.in`). | Client | C-12 | Internal operational visibility. |

---

## 9. Code-Signing and Production Infrastructure

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-24** | Windows Authenticode Code-Signing Certificate | Recommended: Organization Validation (OV) Authenticode certificate for direct Setup.exe download. Do not convert to MSIX (Store does not sign external EXE/MSI). | Authenticode OV code-signing certificate purchased by client (`Brahmi Computing Technologies`). | Client | C-19 | **CLIENT DEPENDENCY**: Certificate procurement is client responsibility. Post-packaging signing procedure documented. |
| **INVENTORY-25** | Production hosting infrastructure & ownership | Project currently developed on Supabase PostgreSQL + Backblaze B2. Client's GoDaddy account mentioned in notes. | Written approval of production hosting architecture: Vercel / Cloudflare Pages / dedicated VPS; confirmation of hosting account billing ownership. | Client | C-15 | Production deployment cutover. |
| **INVENTORY-26** | Domain DNS management for production launch | GoDaddy account credentials delivered in plain text in client notes; password rotation required. | Client confirmation of who will point `brahmicomputing.in` root and `www` A/CNAME records to the production server. | Client / Dev | C-16, C-32 | Launch day cutover. |

---

## 10. Website Copy, Brand Assets, and Content Placeholders

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-27** | Official Brand Tagline Selection | Two taglines appear across client materials. Client indicated tagline will be supplied later. | Final official tagline to be provided by client. | Client | C-33 | Tagline remains open pending client delivery. Placeholders retained. |
| **INVENTORY-28** | Official demonstration screenshots & videos | Media content, product screenshots and demonstration videos will be supplied later by client. | Official high-resolution keyboard layout screenshots and demonstration video links. | Client | C-17 | **CLIENT DEPENDENCY**: Placeholders retained pending client delivery. No stock or fabricated media used. |
| **INVENTORY-29** | Historical monograph and founder story | Historical product content will be supplied later by client. | Approved text for "The Nav Brahmi Story / About the Founder". | Client | C-17 | Placeholders retained pending client delivery. |
| **INVENTORY-30** | Patent citation and marketing claims verification | Client confirms: Simple, default website content without unsupported patent claims or quantified speed numbers. | None. Status: **CONFIRMED & APPLIED** (C-37). Unverified claims removed from public copy. | Client | C-37 | **RESOLVED**: Public copy updated to factual descriptions. Unverified patent and speed claims removed. |
| **INVENTORY-31** | Body-text neutral color confirmation | Brand primary `#E51055`, white `#FFFFFF`, and link `#0066CC` are approved. Logo uses near-black `#231F20` for typography. | Written confirmation to standardize body text neutral to `#231F20`. | Client | C-28 | Design system completion; currently implemented as provisional default. |

---

## 11. Invoicing, GST, and Billing

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-32** | GST Registration Number (GSTIN) status | Pending client meeting. No legal or tax details invented. | Client's official 15-character GSTIN (or formal declaration that business operates under GST threshold exemption). | Client / Accountant | C-13 | **PENDING CLIENT MEETING**: Razorpay kept in TEST mode; no legal tax invoice generated without confirmed business details. |
| **INVENTORY-33** | Invoice numbering sequence and start number | Pending client meeting. | Approved invoice prefix, sequence format, and starting serial number. | Client / Accountant | C-13 | Invoicing compliance. |
| **INVENTORY-34** | Inter-state tax calculation rules (IGST vs CGST/SGST) | Pending client meeting. | Confirmation of customer state collection at checkout to calculate correct tax breakdown on invoice. | Client / Accountant | C-34 | Invoicing compliance. |

---

## 12. Remaining Technical Tasks (Internal Engineering)

| ID | Technical Task | Current Status | Blocker / Dependency | Internal Target |
|---|---|---|---|---|
| **TASK-TECH-01** | Physical Windows hardware execution of 12 test scenarios | Checklist created in `docs/production/test-evidence/windows-test-checklist.md`; all tests marked `PENDING MANUAL WINDOWS VERIFICATION`. | Requires physical Windows 11 x64 test PC. | Windows verification phase. |
| **TASK-TECH-02** | Bootstrapper compilation on Windows | C# source code hardened in `Requirements/windows-driver/bootstrapper/Program.cs` with Ed25519 token check, product-specific font mapping, native architecture check, and MSI 1638 registry verification. | Requires Windows `.NET Framework 4.0/4.5` csc compiler (`csc.exe`). | Windows staging. |
| **TASK-TECH-03** | Production build placeholder clearance | Build succeeds with documented placeholder behavior (`ALLOW_PLACEHOLDERS=true`). Strict build exits with code 1 until client supplies media and tagline. | Awaiting client input items (C-17 media, C-33 tagline). | Pre-deployment gate. |
| **TASK-TECH-04** | Razorpay Live API credentials injection | Test mode keys configured and verified via automated test suite. Live mode strictly disabled. | Client live Razorpay account activation (dependent on Legal pages C-18 and GST C-13). | Production launch day. |

---

## Summary of Findings by Category

- **Total Tracked Inventory Items**: 38 distinct items across 12 categories.
- **Client Action Required (Remaining Questions to Client)**:
  - C-03: Tamil & Tamil Grantha bundling confirmation.
  - C-13 & C-34: GSTIN / tax exemption status and invoice numbering sequence (pending meeting).
  - C-17 (Media): Official product screenshots, demonstration videos, and historical media.
  - C-19: Authenticode OV Code-Signing Certificate procurement.
  - C-33: Official brand tagline.
- **Confirmed & Implemented in Phase 6**:
  - **Pricing (C-02)**: Confirmed retail price ₹472.00 (47200 paise) per language package without extra automatic 18% GST addition. Razorpay kept in TEST mode.
  - **Catalog Separation (C-03)**: Confirmed separate products for Kannada (`KANNADA`) and Tulu (`TULU`); mapped to independent packages. Tamil/Grantha bundling withheld with checkout disabled.
  - **Supported Platforms (C-06)**: Windows 11 64-bit x64 systems on Intel/AMD within servicing lifecycle supported; ARM64, 32-bit Windows, Windows 10, Windows 11 S mode rejected by installer. Windows hardware verification marked PENDING MANUAL WINDOWS VERIFICATION.
  - **1-Machine Rule & Support Reset (C-07)**: One active machine per license enforced. Restricted server-side administrative CLI (`scripts/admin-machine-reset.ts`) enforces 90-day cooldown, admin override, previous binding revocation, and token invalidation. Customer self-service remains disabled.
  - **Refund Policy (C-08 & C-18)**: 7-calendar-day refund intake from server-recorded `installedAt` for serious defects; manual support review; zero automatic refunds or license revocations.
  - **Licensing Scope (C-09)**: Protection scoped to purchase, license generation, 1-machine activation, package download, installer authorization, installation reporting. Installed MSKLC keyboard layout DLLs do NOT contain runtime DRM. Original binaries unmodified.
  - **Customer Support (C-10, C-17)**: Phone `9632819063` and email `support@brahmicomputing.in` updated across website, footer, emails, contact page, and order views.
  - **Code Signing Recommendation (C-19)**: Authenticode OV certificate for Setup.exe direct download; conversion to MSIX rejected; certificate procurement tracked as client dependency.
  - **Font Ownership & Manifest (C-29)**: Font ownership confirmed by Brahmi Computing Technologies. Product-specific font manifest (`src/lib/font-manifest.ts`) and bootstrapper mapping enforce explicit font selection without wildcards or cross-language mixing; persistent Win32 registration without `FR_PRIVATE`.
  - **Truthful Public Copy (C-37)**: Factual public copy; unverified patent claims and quantified speed claims removed (`src/content/home.ts`, `src/content/faq.ts`).
  - **Skeleton Loaders**: Implemented reusable accessible skeleton components and route loading states across all data-loading pages.
