# Client Input Request Email Draft

> **Document Purpose**: Client-ready formal communication draft for Ujwal to review, finalize, and send to the client (Brahmi Computing Technologies).  
> **Status**: Prepared for review. Contains only verified, non-confidential technical and business questions required to finalize production launch.  
> **Traceability**: All items map directly to decision IDs in [14-client-inputs-and-open-decisions.md](file:///home/projects/projects/Ujwal/nav-brahmi-production/docs/production/14-client-inputs-and-open-decisions.md) and [placeholder-and-client-input-inventory.md](file:///home/projects/projects/Ujwal/nav-brahmi-production/docs/production/placeholder-and-client-input-inventory.md).  
> **Note to Sender**: Do NOT ask the client to send secret passwords or API keys over plain email; infrastructure credentials are managed separately. Resend domain DNS verification is already complete and verified.

---

## Ready-to-Send Email Draft

**Subject:** Nav Brahmi Software & Website — Final Pre-Production Information Required for Launch

**Dear Mahesh and the Brahmi Computing Technologies Team,**

We are pleased to share that the core software delivery pipeline, secure license activation engine, Backblaze B2 cloud storage integration, and website infrastructure for Nav Brahmi are now in their final integration and testing stages.

To finalize the website catalog, activate live payment processing through Razorpay, build the final Windows installer packages, and ensure full legal and tax compliance, we need your formal written confirmation on several key business, pricing, and technical items. 

We have organized these into concise, numbered categories below, cross-referencing our project decision register (`C-xx`) so your answers can be directly mapped to the production deployment.

---

### 1. Product Catalog, Packaging & Official Retail Price

* **[C-02] Final Package Retail Price & Tax Structure:**
  Our user manuals indicate a price of **₹480 (Inclusive of all taxes)** per package, while the initial invoice template calculated **₹400 + 18% GST = ₹472**. 
  * Could you please confirm the exact retail price customers should pay at checkout?
  * Please confirm whether this price is tax-inclusive or if GST should be added on top.

* **[C-03] Sellable Products Catalog:**
  We received 14 driver packages, while the original agreement lists 13 language categories.
  * Is **Kannada & Tulu** sold as a single combined package, or will Kannada and Tulu also be available as separate individual purchases?
  * Are **Tamil** and **Tamil Grantha** sold together or as separate products?

---

### 2. Supported Windows Versions & Device Architectures

* **[C-06] Supported Windows Versions:**
  The installer is built to support modern 64-bit Windows systems (Windows 11 and Windows 10 x64), as well as legacy 32-bit Windows 10 (x86). 
  * Please confirm that Windows 10 (64-bit) and Windows 11 (64-bit) represent your primary supported platforms.
  * Please confirm whether Windows on ARM (ARM64 devices like Surface Pro X or newer Snapdragon laptops) is officially unsupported for this initial release, as no ARM64 drivers were delivered.

---

### 3. Font Distribution & System Installation Whitelist

* **[C-29] Approved Fonts Whitelist:**
  Each driver package contains TrueType (`.ttf`) font files. To ensure compliance with font copyright licensing and prevent accidental replacement of existing system fonts on customer machines:
  * Please provide the exact list of proprietary font names approved for automatic installation on customer computers.
  * Please confirm that Brahmi Computing Technologies owns or holds redistribution rights for these delivered fonts.

* **[C-39] OpenType (`.otf`) Support:**
  The Tamil Grantha package contains two `.otf` font files alongside standard `.ttf` files. Should the installer support and register `.otf` fonts as well, or should only standard TrueType (`.ttf`) fonts be installed?

---

### 4. License Policy & Protection Scope Confirmation

* **[C-07] Machine Limit & Hardware Upgrades:**
  We have implemented the agreed rule of **one active computer per license key**.
  * How should license transfers be handled when a customer buys a new computer or replaces a failed hard drive? (For example: allow customer deactivation from the old machine, or require the customer to contact support for a manual reset?)

* **[C-09] Keyboard Layout Architecture & Protection Boundary:**
  As documented in our technical architecture, the Nav Brahmi keyboard drivers are built using Microsoft Keyboard Layout Creator (MSKLC) and install native Windows `.dll` drivers directly into the operating system. Once registered, Windows loads these drivers natively without checking an ongoing background license. 
  * Our security system strictly protects and authorizes: (1) payment validation, (2) license key issuance, (3) encrypted activation token generation, (4) authorized private download from Backblaze B2, and (5) installer execution.
  * Please provide your written confirmation of this technical boundary, acknowledging that installed layout files do not contain runtime DRM.

---

### 5. Business Details, Legal Policies & Razorpay Compliance

*Note: Razorpay mandatorily requires active, published policy pages before they will activate live payment processing.*

* **[C-08 & C-18] Refund and Cancellation Policy:**
  What is the formal refund policy for digital software downloads? (e.g., *"Due to the digital nature of software licenses, all sales are final once activated, except in cases of verified technical incompatibility reported within 7 days."*)

* **[C-18] Terms of Service & Privacy Policy:**
  Please review and approve the draft Terms of Service and Privacy Policy text for the website, or provide your preferred legal disclaimers.

* **[C-17] Official Customer Support Contact:**
  Please provide the official public telephone number and business mailing address to be displayed on the website contact page, invoices, and customer receipts.

---

### 6. GST, Invoicing & Billing Details

* **[C-13] GST Registration Number (GSTIN):**
  Please provide your 15-character GSTIN for inclusion on customer tax invoices. (If Brahmi Computing Technologies is currently operating under the GST turnover exemption threshold, please let us know so we can format invoices accordingly.)

* **[C-13 & C-34] Invoice Numbering:**
  What invoice numbering sequence would your accountant prefer for automated receipts? (e.g., `NB/2026-27/0001` or `BCT-INV-0001`?)

---

### 7. Website Content, Marketing & Branding Choices

* **[C-33] Official Brand Tagline:**
  Two tagline variations appear across the delivered brochures and logo files:
  1. *"Indic Language Typing, Made Easy!"*
  2. *"Your Language, Your Typing, Made Easy"*
  Please let us know which tagline you prefer as the primary headline on the website.

* **[C-17] Product Demonstration Media:**
  If you have product demonstration videos or screenshots of the keyboard layouts in action (normal, Shift, and AltGr keyboard states), please share them so we can replace the placeholder graphics on the product pages.

* **[C-37] Patent & Speed Claims:**
  Please confirm the exact patent number(s) and approved wording for any speed/efficiency claims referenced in your manuals that you would like highlighted on the public website.

---

### 8. Windows Authenticode Code-Signing Certificate

* **[C-19] Code-Signing Certificate:**
  To prevent Microsoft Defender SmartScreen from displaying an *"Unknown Publisher / Windows protected your PC"* warning when customers download and run `Setup.exe`, the executable must be digitally signed with a Code Signing Certificate issued to **Brahmi Computing Technologies**.
  * Does Brahmi Computing Technologies already possess an active Code Signing Certificate?
  * If not, we recommend purchasing a Standard or Extended Validation (EV) Code Signing Certificate (from providers such as DigiCert, Sectigo, or SSL.com) in your company's name. We can guide you through the technical export and signing steps.

---

### Next Steps

Your written confirmation on the items above will allow us to immediately lock in the product catalog, enable tax-compliant invoicing, clear the content placeholders, and submit the site to Razorpay for live payment activation.

Please feel free to reply directly to this email or let us know if you would like a brief call to walk through any of these points together.

Warm regards,

**Ujwal**  
*Nav Brahmi Project Team*  
*Brahmi Computing Technologies Partner Delivery*
