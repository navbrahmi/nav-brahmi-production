# 01 — Project Context and Requirements

## 0. Evidence labels (used in every document)

| Label | Meaning |
|---|---|
| **STATED IN AGREEMENT** | Written in the signed agreement (24 pp., effective 10 Oct 2026). Page numbers are approximate. |
| **CLIENT-SUPPLIED** | Found in the client delivery `Kreovi-NavBrahmi2026-10-17.zip` (read 18 Oct 2026). |
| **VERIFIED IN REPOSITORY** | Confirmed by reading the code in the demo snapshot `client-driver-website-main.zip` (read 18 Oct 2026). Code was read, **not executed**. |
| **VERIFIED BY TEST** | Confirmed by a test run with evidence. **None assigned yet.** |
| **DEVELOPER-REPORTED (UNVERIFIED)** | Stated by the developer; not confirmed in the files provided. |
| **PROPOSED DESIGN** | Recommended for production; not agreed or built. |
| **REQUIRES CLIENT CONFIRMATION** | Cannot be decided by engineering alone. See doc 14. |
| **NOT IMPLEMENTED / NOT EVIDENCED** | No evidence it exists. |

**Evidence base:** (1) agreement PDF; (2) developer's project brief; (3) repository README; (4) client delivery zip; (5) demo repository snapshot. The Git history was **not** available (the snapshot has no `.git` folder), and no tests were executed.

## 1. Parties
- **Client (Disclosing Party):** NAV BRAHMI (proprietor Naveen Jayachandra), Bengaluru.
- **Service provider (Receiving Party):** KREOVI — A Creative Marketing Studio (proprietor Ujwal Praveen), Bengaluru.
- **Domain:** https://www.brahmicomputing.in
- **Fee:** ₹70,000 (§01, §04.1). **Governing law:** India; courts of Bengaluru (§13.6).
- Personal identifiers, bank details, tax numbers and credentials found in the supplied files are intentionally **not reproduced** in any project document.

## 2. Project summary
Design, build, test, deploy and hand over the NAV BRAHMI website including purchase, licensing, machine-bound activation, private storage and authenticated download of Windows keyboard-layout software. No customer accounts; customer email is the identifier (STATED BY DEVELOPER; also encoded in the demo repo rules).

## 3. Agreement-derived requirements (summary; full list with IDs in doc 17)
- **Pages (§02, pp3–4):** Home (About, Vision & Mission); product pages for the language categories; language-specific purchase pages; screenshots/graphics/videos/font links; FAQ/help; download/installation instructions; "how Brahmi became user-friendly" story; contact information.
- **Features (§02, pp4–6):** responsive design; professional UI/UX; payment gateway; purchase flow; order confirmation; license generation and validation; secure installation authorization; machine-bound activation; controlled distribution; private storage; temporary/authenticated download; integrity verification; installation instructions; customer email/license delivery; business email setup; invoicing/billing/instruction-manual/sticker by WhatsApp/Email; contact form; basic SEO; cross-browser; SSL/security; deployment to client's hosting; testing; 30-day bug fix.
- **Qualifiers:** licensing/delivery is "subject to technical feasibility and mutual agreement" (§02.4); no guarantee against copying/cracking (§02.4, §08.2, §08.3, §10); no sales guarantee (§10, §12.4).
- **Client responsibilities (§03):** content, assets, technical info, access to domain/hosting/payment gateway/third parties, timely feedback.
- **Third-party costs:** borne by the client unless agreed otherwise (§06.4, §09).
- **Acceptance/support (§12):** defects reported within 7 days of presentation; 30 days free bug-fix support limited to in-scope bugs; post-launch evaluation up to 90 days.

## 4. Products: 13 agreement categories vs 14 delivered packages
**STATED IN AGREEMENT (§02):** 13 categories. **CLIENT-SUPPLIED:** 14 product folders, each with a keyboard-layout installer set, manual PDF, sticker, fonts, and a logo. Details and open questions in doc 13.

| Agreement category | Delivered product folder(s) |
|---|---|
| 1 Ashokan Brahmi and Devanagari | Ashokan Brahmi |
| 2 Bengali and Devanagari | Bengali |
| 3 Devanagari/Hindi | Devanagari |
| 4 Gujarati and Devanagari | Gujarati |
| 5 Kannada, Tulu and Devanagari | Kannada; (Tulu is a separate product) |
| 6 Malayalam and Devanagari | Malayalam |
| 7 Modi/Marathi and Devanagari | Modi-Marathi |
| 8 Oriya/Odia and Devanagari | Oriya-Odia |
| 9 Punjabi/Gurmukhi and Devanagari | Punjabi-Gurmukhi |
| 10 Tamil and Tamil Grantha | **Two** products: Tamil; Tamil Grantha |
| 11 Telugu and Devanagari | Telugu |
| 12 Tulu and Devanagari | Tulu (Tigalari script) |
| 13 Sharada (Kashmiri) and Devanagari | Sharada |

The delivered packages are not named "… and Devanagari". What a customer receives for "X and Devanagari" (the X package, the Devanagari package, or both) REQUIRES CLIENT CONFIRMATION (C-03).

## 5. Confirmed facts
| Fact | Source |
|---|---|
| Agreement effective 10 Oct 2026; fee ₹70,000 | STATED IN AGREEMENT §01 |
| Deployment is to the **client's** hosting | STATED IN AGREEMENT §02, §02.5 |
| Confidentiality also governed by a separate NDA, which prevails on conflict | STATED IN AGREEMENT §07 |
| Payment provider is **Razorpay** | Stated by developer (17 Oct 2026). Written client confirmation that it is the "agreed payment gateway" (§02.3), and account ownership: REQUIRES CLIENT CONFIRMATION |
| **Brand colours (final, per client): #E51055, #FFFFFF; #0066CC for links and similar uses. Nothing else.** | Stated by developer (18 Oct 2026) — supersedes the earlier "not confirmed" and the earlier note listing the colours |
| Website must be simple (KISS) and visually distinctive | Stated by developer |
| 14 products delivered, 15 logos (master + 14), manuals, stickers, fonts | CLIENT-SUPPLIED |
| Manuals of all 14 products state the price **₹480 including all taxes** | CLIENT-SUPPLIED (manuals). Conflicts with the invoice template (₹400 + 18% GST = ₹472) — C-02 |
| Four mailboxes to be created on brahmicomputing.in: navbrahmi, mahesh, naveen, support | CLIENT-SUPPLIED (client notes) |
| The installer sets are Keyboard Layout Creator (MSKLC) output with MSIs for amd64, i386, ia64; **no ARM64** | CLIENT-SUPPLIED (file metadata) |
| Demo repo: Next.js 14 + TypeScript, Prisma 5, PostgreSQL, Backblaze B2, C# WinForms bootstrapper | VERIFIED IN REPOSITORY |
| Demo repo is a **prototype**: it contains critical security issues and issues licenses without payment | VERIFIED IN REPOSITORY (doc 02 §8) |

## 6. Current implementation
See doc 02. In short: a working-looking prototype of purchase → license → activation → presigned download → SHA-256 → MSI install, built around two demo products (Brahmi Tamil Grantha, Kharoshthi) that are not the client's 14 products. Payment, email, contact form, invoices, analytics, the 14 products, and most website pages **do not exist**.

## 7. Scope boundaries
**In scope:** everything in §3. **Out of scope unless a written change is approved (§05.3, §13.2):** customer login/accounts; additional platforms; new languages beyond the delivered products; ongoing maintenance/security monitoring after the support period (§12.3, §08.3); changes to licensing rules after approval (§12.3); sales/revenue guarantees; modifying the client's proprietary binaries.

## 8. Explicitly unresolved requirements
See doc 14. Highest impact: Razorpay account ownership, live keys and capture settings; product↔category mapping and bundles; price (₹480 vs ₹472) and tax handling; billing fields needed for the GST invoice; supported Windows versions and architectures (x86/x64/ia64/ARM64); activation/reset/refund rules; hosting (client's hosting vs Vercel); email provider; written approval to host the NDA packages on Cloudflare R2; font licences.

## 9. Agreement observations flagged for human review (no legal conclusions)
1. **Payment schedule inconsistency (§04.2):** 50% = ₹35,000 is arithmetically correct. The "30%" milestone is priced ₹15,000 (30% of ₹70,000 would be ₹21,000) and the "20%" milestone ₹20,000 (20% would be ₹14,000). The amounts sum to ₹70,000; the percentages do not match.
2. **Handover vs final payment:** the final ₹20,000 is payable "90 day after final deployment and handover" (§04.2), yet deliverables, source code and credentials are handed over "upon receipt of full payment" (§06.3, §12.2).
3. **Hosting:** "Deployment to Client's Hosting" (§02, §02.5) vs the prototype on Vercel.
4. **Headings/boilerplate:** §09 and §10 headings read as near-duplicates; §14 refers to a "Master Services Agreement", "Annexures" and a "Commercial Schedule" not in the supplied text. Receiving-party signature/date and witness fields appear blank in the supplied copy.
5. **Deliverables with no detail:** business email setup, invoicing, and "instruction manual / sticker by WhatsApp/Email" (partly clarified by CLIENT-SUPPLIED files, doc 09).
6. **Timeline:** to be mutually agreed before development starts (§05.1); none is stated.
7. **Licensing language vs reality (§08.1):** the agreement mentions "driver integration mechanisms". The delivered products are standard keyboard-layout installers that cannot check a license after installation (doc 07 §11). The client should acknowledge that protection covers authorized download and install only.
8. **Delivered files contain sensitive data:** the client zip includes account credentials in plain text; the demo repo snapshot includes what appear to be live storage credentials (doc 02 §8).

## 10. Website design principles
- **KISS:** only the pages and features in the agreement; no customer accounts; no feature added because it is common elsewhere; minimal dependencies and client-side JavaScript.
- **Brand palette (client-final):** `#E51055` (primary / accent), `#FFFFFF` (white / surfaces), `#0066CC` (links and similar secondary uses). **No other brand colours.**
  - Contrast (computed): white text on #E51055 = 4.63:1 (meets WCAG AA for normal text); #0066CC on white = 5.57:1 (meets AA); #E51055 on white = 4.63:1 (meets AA); #0066CC on #E51055 = 1.20:1 (**never place blue on red**).
  - A body-text neutral is not part of the palette. The supplied logo uses near-black (#231F20). Using it for text is PROPOSED and REQUIRES CLIENT CONFIRMATION (C-28); until then it is a token marked PROVISIONAL.
- **Distinctive:** the supplied logo is a 3×3 grid of monitors, each showing a script letter in red. PROPOSED concept: *script-first* — pages lead with large script specimens (client text and licensed fonts), the monitor-grid motif from the logo, one accent colour, no stock imagery. Needs client approval; theme tokens keep it easy to change.
- **Taglines in supplied materials:** "Indic Language Typing, Made Easy!" (logo) and "Your Language, Your Typing, Made Easy" (manuals). Which is official: C-33.
- UI language(s): English unless the client says otherwise (C-31).

### Phase 3 Website Implementation Status (VERIFIED BY TEST)
- **Palette and Tokens:** `--brand: #E51055`, `--surface: #FFFFFF`, `--link: #0066CC`, and `--text-body: #231F20` (provisional) implemented in `src/app/globals.css`. Contrast verified by test (white on brand 4.63:1, link on surface 5.57:1, text on surface 15.6:1, blue never placed on red).
- **Architecture & Motif:** 3x3 monitor grid motif from client SVG delivery (`public/logos/`) on Home (`src/app/page.tsx`), script-first specimen displays with verified BCP-47 tags on all 13 agreement category pages (`src/app/products/[slug]/page.tsx`). Header strictly limited to six navigation links.
- **Verification:** 34/34 automated tests passing. Lighthouse mobile scores: Home (99 Perf / 94 A11y / 96 BP / 100 SEO), Product (99 Perf / 96 A11y / 96 BP / 100 SEO). Strict build check `scripts/check-placeholders.ts` fails production builds while unsupplied client placeholders remain and passes when allowed.
