# Client Input Request Email Draft

> **Document Purpose**: Client-ready formal communication draft for Ujwal to review, finalize, and send to the client (Brahmi Computing Technologies).  
> **Status**: Updated following Phase 6 confirmed client decisions. Reconciled against [14-client-inputs-and-open-decisions.md](file:///home/projects/projects/Ujwal/nav-brahmi-production/docs/production/14-client-inputs-and-open-decisions.md) and [placeholder-and-client-input-inventory.md](file:///home/projects/projects/Ujwal/nav-brahmi-production/docs/production/placeholder-and-client-input-inventory.md).  
> **Note to Sender**: Do NOT ask the client to send secret passwords or API keys over plain email; infrastructure credentials are managed separately. Resend domain DNS verification is already complete and verified.

---

## Ready-to-Send Email Draft

**Subject:** Nav Brahmi Software & Website — Update on Confirmed Decisions & Final Remaining Launch Items

**Dear Mahesh and the Brahmi Computing Technologies Team,**

Thank you for your latest set of confirmations. We have successfully implemented the following decisions into the Nav Brahmi application, licensing system, and Windows bootstrapper:

1. **Product Pricing [C-02]:** Confirmed retail price of **₹472.00 per language package** (47200 paise) locked into catalog and checkout without an automated 18% GST surcharge. (Razorpay remains in test mode).
2. **Product Catalog [C-03]:** Established **Kannada** and **Tulu** as separate, authoritative products with independent package and font mappings.
3. **Platform Support [C-06]:** Formalized initial target support for **Windows 11 (64-bit x64 systems on Intel/AMD)**. Configured the installer to halt with an informative message on unsupported configurations (ARM64, 32-bit Windows, Windows 10, Windows 11 S mode, non-Windows).
4. **Machine Licensing [C-07]:** Enforced the rule of **one active machine per license**. Built a restricted administrative support-assisted reset operation enforcing a 90-day cooldown period and invalidating old activation tokens. Customer self-service deactivation remains disabled.
5. **Refund Policy [C-08 & C-18]:** Built the customer refund request intake workflow allowing applications within **7 calendar days of installation** for serious functional defects. Configured all requests to route to support (`PENDING_REVIEW`) with zero automatic payouts or license revocations.
6. **Licensing Protection Scope [C-09]:** Scoped protection strictly to purchase, license generation, 1-machine activation, Backblaze B2 package download, installer authorization, and installation reporting. Original client layout binaries remain unmodified with no runtime DRM.
7. **Customer Support Contact [C-10, C-17]:** Displaying official email **support@brahmicomputing.in** and telephone **9632819063** across website footer, contact form, instructions, recovery, and email templates.
8. **Font Ownership & Manifest [C-29]:** Acknowledged Brahmi Computing Technologies' font ownership and redistribution rights. Implemented strict product-specific font mapping and persistent Win32 font registration without wildcards or cross-language mixing.
9. **Truthful Public Content [C-37]:** Standardized public website copy on simple, factual descriptions, removing unverified patent references and quantified speed claims.
10. **Professional Skeleton Loaders:** Added smooth, accessible skeleton loading states across all data-loading views.

---

### Remaining Items Required for Production Launch

To finalize the remaining catalog entries, prepare tax-compliant invoicing, replace media placeholders, and complete code signing, we need your confirmation on the following outstanding items:

#### 1. [C-03] Tamil & Tamil Grantha Catalog Grouping
* Please confirm whether **Tamil** and **Tamil Grantha** should be sold together as a single combined package (₹472), or as two separate individual products (₹472 each).
* *Current status:* Both packages are securely registered in storage, but withheld from checkout until you confirm this grouping.

#### 2. [C-13 & C-34] GST Registration & Tax Invoicing (Pending Scheduled Meeting)
* Please provide your 15-character **GSTIN** (or formal confirmation that the business operates under the GST turnover threshold exemption).
* Please confirm your preferred **invoice numbering sequence** (e.g. `NB/2026-27/0001` or `BCT-INV-0001`).
* *Current status:* No tax invoices or GST breakdowns are generated until confirmed in our upcoming meeting.

#### 3. [C-17] Official Product Demonstration Media
* Please provide official high-resolution screenshots of the keyboard layouts in action (normal, Shift, and AltGr keyboard states) and any demonstration video links.
* Please provide approved founder/historical narrative text for the story page.
* *Current status:* Placeholders are safely retained; no fabricated or stock media has been used.

#### 4. [C-19] Windows Authenticode Code-Signing Certificate
* To prevent Windows Defender SmartScreen from displaying an *"Unknown Publisher"* warning when customers download and run `Setup.exe`, an **Organization Validation (OV) Code Signing Certificate** must be procured in the legal name of **Brahmi Computing Technologies**.
* Please confirm when your team will purchase this certificate (from DigiCert, Sectigo, or SSL.com) so we can provide secure instructions for signing the finalized executable.

#### 5. [C-33] Official Brand Tagline
* Two tagline variations appear across your delivered brochures and logo materials:
  1. *"Indic Language Typing, Made Easy!"*
  2. *"Your Language, Your Typing, Made Easy"*
* Please confirm your preferred tagline for the website header and SEO metadata.

---

### Next Steps

Once the items above are confirmed, we will enable checkout for the remaining language package(s), finalize the invoicing engine, clear all media placeholders, and prepare for live payment activation.

Please let us know your availability for our scheduled meeting regarding GST and invoicing.

Warm regards,

**Ujwal**  
*Nav Brahmi Project Team*  
*Brahmi Computing Technologies Partner Delivery*

