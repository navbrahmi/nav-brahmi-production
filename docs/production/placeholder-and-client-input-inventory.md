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
| **INVENTORY-01** | Official sellable catalog scope (14 delivered packages vs 13 agreement categories) | 14 packages delivered in `Requirements/Software/`; Agreement specifies 13 categories. | Written confirmation whether Kannada & Tulu is sold as 1 bundle or 2 distinct products, and whether Tamil & Tamil Grantha are sold together or separately. | Client | C-03 | **BLOCKS CATALOG EXPANSION**: Currently only single verified product is active in checkout; remaining 13 packages remain unlisted. |
| **INVENTORY-02** | Kharoshthi package classification | Package exists only in historical prototype; not listed in agreement or client delivery files. | Confirmation that Kharoshthi was prototype-only demo and should remain excluded from production catalog. | Client | C-04 | Low; Kharoshthi is currently excluded from product seeds. |
| **INVENTORY-03** | Canonical package naming and internal duplicates | Package inspection revealed Kannada installer copy inside Malayalam fonts directory and shared build dates. | Client verification that delivered packages in `Requirements/Software/` are the final canonical release masters. | Client | C-36 | Quality assurance; ensures exact intended binary is installed for each language. |

---

## 2. Pricing and Tax

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-04** | Conflicting retail price per package (₹480 vs ₹472) | User manuals explicitly state: `"Price: Rs. 480/- (Inclusive of all taxes)"`. Invoice template calculates `₹400 + 18% GST = ₹472`. | Approved final retail price in INR and tax treatment (whether price is inclusive of 18% GST or base ₹400 + tax). | Client / Accountant | C-02 | **BLOCKS LIVE SALES**: Checkout currently enforces test price ₹39 / provisional ₹480; cannot lock production catalog price without client sign-off. |
| **INVENTORY-05** | Multi-product bundle pricing and discounts | Agreement mentions `"Language-specific purchasing pages"`; no multi-product cart or bundle discount rules defined. | Confirmation whether multi-product purchases, educational discounts, or all-language bundles are offered. | Client | C-30 | Medium; current system enforces one product per checkout transaction. |

---

## 3. Licensing and Activation

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-06** | Machine activation limit rule | Explicitly confirmed by project owner (2026-10-24): **One active machine per license**. | None for limit (confirmed as 1). Status: **CONFIRMED & ENFORCED**. | Project Owner / Developer | C-07 | Implemented via database row lock and `maxActivations: 1`. |
| **INVENTORY-07** | Machine replacement and deactivation policy | Customers will upgrade laptops, experience hardware failures, or reinstall Windows. | Approved policy: Can a customer deactivate from an old PC? How many transfers are allowed per year? Is manual support approval required? | Client | C-07 | Deactivation API currently returns HTTP 400 `DEACTIVATION_POLICY_UNCONFIRMED`. |
| **INVENTORY-08** | Client acknowledgement of licensing boundary | MSKLC keyboard layouts install native `.dll` files into `C:\Windows\System32`. Windows loads them natively without runtime license checking. | Client written confirmation that protection covers purchase verification, signed token activation, and authorized installation, but not runtime layout DRM. | Client | C-09 | **CRITICAL CONTRACTUAL ALIGNMENT**: Prevents post-handover dispute regarding operating-system keyboard driver architecture limitations. |
| **INVENTORY-09** | Offline customer support and lost-email recovery | Automated email recovery handles customers with active purchase emails. | Standard Operating Procedure (SOP) for customers who lost email access: What proof of purchase (bank statement, Razorpay ID) is required? | Client | C-10 | Support operations; prevents unauthorized license re-assignment. |

---

## 4. Windows and Architecture Support

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-10** | Supported Windows versions & architecture matrix | Client packages include `amd64`, `i386`, and `ia64` folders. Windows 11 is 64-bit only; ARM64 devices (Surface Pro X, Copilot+ PCs) are increasingly common. | Formal approval of supported platform list: Windows 10/11 x64 (Standard), Windows 10 x86 (Legacy)? Written confirmation that ARM64 and IA64 are unsupported. | Client | C-06 | Bootstrapper explicitly filters x64/x86 and rejects ARM64/IA64 with descriptive error; needs client platform sign-off. |
| **INVENTORY-11** | Minimum supported Windows OS build | Client packages were generated with Microsoft Keyboard Layout Creator 1.4. | Minimum OS requirement (e.g. Windows 10 Build 1809+ / Windows 11). | Client | C-06 | Displayed on product pages and system requirements table. |

---

## 5. Fonts and Installation Behavior

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-12** | Client-approved font whitelist (C-29) | Client packages contain various `.ttf` files; font copyright licenses and commercial redistribution rights are unverified in delivered files. | Explicit list of proprietary fonts approved for silent system installation, and confirmation that client owns or licenses redistribution rights. | Client | C-29 | **BLOCKS UNCONTROLLED FONT INSTALL**: Bootstrapper currently filters out unapproved fonts to prevent font-clobbering or IP infringement. |
| **INVENTORY-13** | OpenType (.otf) font support | Tamil Grantha package contains 2 `.otf` files; bootstrapper `.ttf` filter currently skips `.otf` files. | Client decision: Should installer register `.otf` fonts, or should only standard TrueType (`.ttf`) fonts be supported? | Client | C-39 | Determines whether Tamil Grantha OTF fonts are registered. |
| **INVENTORY-14** | Font installation scope (System-wide vs Per-user) | Windows 10 1809+ supports per-user font installation without admin rights; System-wide font installation requires `HKLM` and UAC admin elevation. | Client confirmation: Should fonts install system-wide (`C:\Windows\Fonts`) requiring admin elevation, or per-user? | Client | C-29 | Governs installer UAC requirements and registry keys. |

---

## 6. Business Contact and Customer Support

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-15** | Official public customer support phone number | Visiting card shows mobile numbers; agreement shows office contact; conflict between documents. `src/content/contact.ts:44` and `src/content/site.ts:63` have placeholders. | Official customer support phone number approved for public display on website header, footer, and invoices. | Client | C-17 | **BLOCKS STRICT PRODUCTION BUILD**: Build checks enforce no placeholder strings in `src/content`. |
| **INVENTORY-16** | Registered physical business address | Multiple addresses appear across visiting card, agreement header, and invoice template. | Official registered business address for legal footer, invoice headers, and Razorpay business verification. | Client | C-17, C-34 | Required for consumer protection compliance and payment gateway verification. |
| **INVENTORY-17** | Customer support hours and SLA | FAQ states support is available; hours are not defined. | Official working hours (e.g., Monday–Friday 9:30 AM – 6:00 PM IST) and support response SLA. | Client | C-17 | Customer transparency; prevents unrealistic support expectations. |

---

## 7. Legal, Refund, and Customer-Facing Policy

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-18** | Digital software refund and cancellation policy | `src/content/faq.ts:82` has placeholder. Razorpay Merchant Onboarding requires mandatory published Refund Policy. | Written policy: Are digital software licenses non-refundable once activated/downloaded? What is the dispute/chargeback window (e.g., 7 days for technical incompatibility)? | Client / Legal | C-08, C-18 | **HARD GATE FOR RAZORPAY LIVE ACTIVATION**: Razorpay compliance will reject merchant activation without live Refund URL. |
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
| **INVENTORY-24** | Windows Authenticode Code-Signing Certificate | Prototype used unverified ad-hoc binaries. Windows SmartScreen displays prominent blue warning (`"Windows protected your PC"`) on unsigned executables. | Standard or EV (Extended Validation) Code Signing Certificate purchased under client's registered entity name (`Brahmi Computing Technologies`). | Client | C-19 | **CRITICAL USER EXPERIENCE BLOCKER**: Without an EV/OV certificate, Windows Defender SmartScreen blocks user installation with untrusted publisher warning. |
| **INVENTORY-25** | Production hosting infrastructure & ownership | Project currently developed on Supabase PostgreSQL + Backblaze B2. Client's GoDaddy account mentioned in notes. | Written approval of production hosting architecture: Vercel / Cloudflare Pages / dedicated VPS; confirmation of hosting account billing ownership. | Client | C-15 | Production deployment cutover. |
| **INVENTORY-26** | Domain DNS management for production launch | GoDaddy account credentials delivered in plain text in client notes; password rotation required. | Client confirmation of who will point `brahmicomputing.in` root and `www` A/CNAME records to the production server. | Client / Dev | C-16, C-32 | Launch day cutover. |

---

## 10. Website Copy, Brand Assets, and Content Placeholders

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-27** | Official Brand Tagline Selection | Two taglines appear across client materials: `"Indic Language Typing, Made Easy!"` vs `"Your Language, Your Typing, Made Easy"`. `src/content/site.ts:67` has placeholder. | Client choice between the two tagline variants for hero banners and SEO meta tags. | Client | C-33 | **BLOCKS STRICT PRODUCTION BUILD**. |
| **INVENTORY-28** | Per-language demonstration screenshots & videos (13 categories) | `src/content/categories.ts` lines 68, 105, 141, etc. have 39 placeholder entries for screenshots, demo videos, and font download links. | Official high-resolution keyboard layout screenshots (normal, Shift, AltGr states) and demonstration video links for each language. | Client | C-17 | **BLOCKS STRICT PRODUCTION BUILD** (39 entries). |
| **INVENTORY-29** | Historical monograph and founder story | `src/content/story.ts:43` contains placeholder for founder narrative text. | Approved text for "The Nav Brahmi Story / About the Founder". | Client | C-17 | **BLOCKS STRICT PRODUCTION BUILD**. |
| **INVENTORY-30** | Patent citation and marketing claims verification | `src/content/home.ts:58` has placeholder regarding patent citation and speed claims. | Written client confirmation of patent number(s) and authorization to cite them publicly. | Client | C-37 | Legal protection; ensures marketing copy does not make unauthorized patent claims. |
| **INVENTORY-31** | Body-text neutral color confirmation | Brand primary `#E51055`, white `#FFFFFF`, and link `#0066CC` are approved. Logo uses near-black `#231F20` for typography. | Written confirmation to standardize body text neutral to `#231F20`. | Client | C-28 | Design system completion; currently implemented as provisional default. |

---

## 11. Invoicing, GST, and Billing

| ID | Item / Missing Value | Known Evidence | Missing Real Value | Responsible Party | C-xx Ref | Production Release Impact |
|---|---|---|---|---|---|---|
| **INVENTORY-32** | GST Registration Number (GSTIN) status | `src/content/site.ts:64` has placeholder. Invoice template includes GSTIN field; client turnover threshold / composition status unconfirmed. | Client's official 15-character GSTIN (or formal declaration that business operates under GST threshold exemption). | Client / Accountant | C-13 | **BLOCKS TAX-COMPLIANT INVOICING**: Invoices cannot print `"GSTIN: Pending"` in production. |
| **INVENTORY-33** | Invoice numbering sequence and start number | GST rules require unique consecutive invoice numbering per financial year (e.g., `NB/2026-27/0001`). | Approved invoice prefix, sequence format, and starting serial number. | Client / Accountant | C-13 | Automated post-payment invoice generation. |
| **INVENTORY-34** | Inter-state tax calculation rules (IGST vs CGST/SGST) | Client registered in Karnataka. Sales to customers in Karnataka attract CGST (9%) + SGST (9%); sales outside Karnataka attract IGST (18%). | Confirmation of customer state collection at checkout to calculate correct tax breakdown on invoice. | Client / Accountant | C-34 | Invoicing compliance for B2B/B2C sales. |

---

## 12. Remaining Technical Tasks (Internal Engineering)

| ID | Technical Task | Current Status | Blocker / Dependency | Internal Target |
|---|---|---|---|---|
| **TASK-TECH-01** | Physical Windows hardware execution of 12 test scenarios | Checklist created in `docs/production/test-evidence/windows-test-checklist.md`; all tests marked `PENDING MANUAL WINDOWS VERIFICATION`. | Requires physical Windows 10/11 x64 test PC. | Post-Ubuntu verification. |
| **TASK-TECH-02** | Bootstrapper compilation on Windows | C# source code hardened in `Requirements/windows-driver/bootstrapper/Program.cs` with Ed25519 token check, font whitelist, and MSI 1638 registry verification. | Requires Windows `.NET Framework 4.0/4.5` csc compiler (`csc.exe`). | Windows staging. |
| **TASK-TECH-03** | Production build strict placeholder clearance | `npm run build` currently succeeds with `ALLOW_PLACEHOLDERS=true`. Strict build (`scripts/check-placeholders.ts`) exits with code 1 until client supplies items 27–30. | Awaiting client input items. | Pre-deployment gate. |
| **TASK-TECH-04** | Razorpay Live API credentials injection | Test mode keys configured and verified via automated test suite. | Client live Razorpay account activation (dependent on Legal pages C-18). | Production launch day. |

---

## Summary of Findings by Category

- **Total Tracked Inventory Items**: 38 distinct items across 12 categories.
- **Client Action Required (Questions to Client)**: 24 items.
- **Accountant / Legal Action Required**: 5 items (Tax, GST, Terms, Privacy, Refund).
- **Project Owner Action Required**: 5 items (Hosting billing, Code-signing certificate purchase, GoDaddy credential rotation).
- **Internal Developer Tasks**: 4 tasks (Windows compilation, hardware test execution, strict placeholder gate, live secrets injection).
- **Confirmed & Resolved in Phase 5**:
  - Storage provider: Backblaze B2 confirmed (`navbrahmi-prod-packages`); Cloudflare R2 cancelled (C-05). 20 architecture-specific packages for 10 established products uploaded, verified against local SHA-256, and registered in PostgreSQL database. 3 ambiguous categories (Kannada, Tulu, Tamil and Grantha) documented as blocked by client decision C-03.
  - Machine activation limit: 1 active machine per license confirmed & enforced (C-07).
  - Resend Domain DNS & Delivery: `brahmicomputing.in` DNS verified (DKIM, SPF, MX); API key configured; controlled test email sent to `support@brahmicomputing.in` (Message ID: `01a16d70-d232-7d3c-b36f-fff97fca308e`), delivered event confirmed by Resend API event log (C-11).
  - License recovery security: Authenticated AES-256-GCM encryption at rest implemented; zero raw keys in DB, logs, outbox, or public API responses (C-10).
  - Windows installer architecture & security: x64/x86 native detection, C-29 font allowlist (`navbrahmi-regular.ttf`, `navbrahmi-bold.ttf`), persistent Win32 font installation without `FR_PRIVATE`, canonical Ed25519 token validation (`tid`/`jti`, `lid`/`lic`, `pid`/`prd`, `mch`, `iat`, `exp`, `kid`) with pure C# RFC 8032 curve verifier, and MSI 1638 registry verification implemented in C# source. Actual Windows runtime tests tracked as PENDING MANUAL WINDOWS VERIFICATION.
