# 13 — Product Catalog and Package Matrix

> Evidence labels: doc 01 §0. Source: CLIENT-SUPPLIED delivery (`Kreovi-NavBrahmi2026-10-17.zip`, read 18 Oct 2026). Package contents, file names and hashes are confidential (NDA) and are not listed. Prices below are what the client's own manuals state; the invoice template conflicts (C-02), so **no price is confirmed**.

## 1. Delivered products (14)

Each product folder contains: MSKLC installer set (MSIs for amd64, i386, ia64 + DLLs + MSKLC `setup.exe`), a manual PDF, a sticker, fonts, and a per-language logo.

| #   | Product (folder)       | Architectures delivered | Fonts delivered (files) | Manual | Sticker           | Logo | Notes                                                     |
| --- | ---------------------- | ----------------------- | ----------------------- | ------ | ----------------- | ---- | --------------------------------------------------------- |
| 1   | Ashokan Brahmi         | x64, x86, ia64          | 1                       | PDF    | PDF               | yes  |                                                           |
| 2   | Bengali                | x64, x86, ia64          | 47                      | PDF    | PDF               | yes  |                                                           |
| 3   | Devanagari (Hindi)     | x64, x86, ia64          | 39                      | PDF    | PDF               | yes  |                                                           |
| 4   | Gujarati               | x64, x86, ia64          | 36                      | PDF    | PDF               | yes  |                                                           |
| 5   | Kannada                | x64, x86, ia64          | 1                       | PDF    | PDF               | yes  | shares an installer build with Malayalam                  |
| 6   | Malayalam              | x64, x86, ia64          | 77                      | PDF    | PDF               | yes  | its fonts folder contains a copy of the Kannada installer |
| 7   | Modi-Marathi           | x64, x86, ia64          | 1                       | PDF    | PDF               | yes  |                                                           |
| 8   | Oriya-Odia             | x64, x86, ia64          | 36                      | PDF    | **SVG** (not PDF) | yes  |                                                           |
| 9   | Punjabi-Gurmukhi       | x64, x86, ia64          | 36                      | PDF    | PDF               | yes  |                                                           |
| 10  | Sharada                | x64, x86, ia64          | 1                       | PDF    | PDF               | yes  |                                                           |
| 11  | Tamil                  | x64, x86, ia64          | 40                      | PDF    | PDF               | yes  |                                                           |
| 12  | Tamil Grantha          | x64, x86, ia64          | 12 (10 TTF + 2 OTF)     | PDF    | PDF               | yes  |                                                           |
| 13  | Telugu                 | x64, x86, ia64          | 37                      | PDF    | PDF               | yes  |                                                           |
| 14  | Tulu (Tigalari script) | x64, x86, ia64          | 1                       | PDF    | PDF               | yes  | custom Tigalari font supplied                             |

No ARM64 build exists for any product. Font counts include many weights/variants of the same family.

## 2. Agreement categories vs delivered products (STATED IN AGREEMENT §02 vs CLIENT-SUPPLIED)

| Agreement category                   | Delivered         | Open question                                             |
| ------------------------------------ | ----------------- | --------------------------------------------------------- |
| 1 Ashokan Brahmi and Devanagari      | #1                | Does the customer also get Devanagari?                    |
| 2 Bengali and Devanagari             | #2                | same                                                      |
| 3 Devanagari/Hindi                   | #3                | —                                                         |
| 4 Gujarati and Devanagari            | #4                | Devanagari?                                               |
| 5 Kannada, Tulu and Devanagari       | #5 and #14 (Tulu) | Is this a bundle of Kannada + Tulu (+ Devanagari)? Price? |
| 6 Malayalam and Devanagari           | #6                | Devanagari?                                               |
| 7 Modi/Marathi and Devanagari        | #7                | Devanagari?                                               |
| 8 Oriya/Odia and Devanagari          | #8                | Devanagari?                                               |
| 9 Punjabi/Gurmukhi and Devanagari    | #9                | Devanagari?                                               |
| 10 Tamil and Tamil Grantha           | #11 and #12       | One product or two?                                       |
| 11 Telugu and Devanagari             | #13               | Devanagari?                                               |
| 12 Tulu and Devanagari               | #14               | Is this separate from #5?                                 |
| 13 Sharada (Kashmiri) and Devanagari | #10               | Devanagari?                                               |

All of these REQUIRE CLIENT CONFIRMATION (C-03). Do not assume bundles, per-product prices for bundles, or the sellable catalog until answered.

## 3. Price and product content

- **Price:** the manuals of all 14 products state ₹480 including all taxes (CLIENT-SUPPLIED). The invoice template computes ₹400 + 9% CGST + 9% SGST = ₹472. Conflict → C-02. Bundle pricing unknown.
- **Content available:** About/Vision text and feature/usage text inside the manuals; contact details on the visiting card; logos; stickers; manuals. **Missing:** Brahmi story text, FAQ, product screenshots and videos, per-product marketing copy, specimen text per script.
- Manual claims (patent statements, efficiency claims) need client approval before reuse on the website (C-37).

## 4. Fonts and licences (C-29)

Delivered fonts include Noto families (published under open licences; verify per file) and many others whose licences are not stated, including the Grantham family and `grantha-sangam-mn` (one name matches an Apple font — verify), plus a custom Tulu Tigalari font made for the client. Until each font's licence permits redistribution: (a) do not self-host them on the website, (b) do not include them in downloadable packages, (c) the website may use only fonts the client confirms (Noto families are the likely safe default after verification).

## 5. Package design for production (PROPOSED)

- Sellable product → `Product`; per architecture → `ProductPackage` (x64, x86; others only if the client confirms); manual and sticker → `ProductAsset`.
- Package contents per architecture: that architecture's MSI plus fonts confirmed in §4. The client's stock `setup.exe`, ia64 files (unless requested) and unconfirmed fonts are excluded.
- Installation prerequisites: administrator rights (MSI install), sign-out/restart behaviour of MSKLC layouts and the keyboard switching shortcut (Windows key + Space per the sticker) are to be confirmed and written into the install page.

## 6. Folder oddities for the client (C-36)

Kannada and Malayalam share one installer build; the Malayalam fonts folder holds a copy of the Kannada installer; Kannada has a single font file; the Oriya sticker is SVG, not PDF; some logos have two variants (with and without "Objects"). Ask which files are canonical.

## 7. Confirmation status per product

All 14: package files delivered (CLIENT-SUPPLIED); catalog mapping, price, bundles, architectures to ship, fonts to ship, and content: **REQUIRES CLIENT CONFIRMATION**.

### Phase 3 Website Mapping (FACTS)
- 13 agreement categories mapped in `src/content/categories.ts` and rendered in `/products` and `/products/[slug]`.
- Client SVG logos mapped from delivery and served from `public/logos/`.
- Unsupplied content (specifications, screenshots, videos, font downloads) marked with literal `PLACEHOLDER` and verified by automated scanner `scripts/check-placeholders.ts`.

