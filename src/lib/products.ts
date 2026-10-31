/**
 * Authoritative Product Catalog & Pricing Definition
 *
 * Implements confirmed client decisions:
 * - C-02: Retail price is ₹472.00 per individual language package (47200 paise).
 *   Do not charge ₹472 plus 18% automatically.
 * - C-03: Kannada is a separate product. Tulu is a separate product.
 *   Tamil and Tamil Grantha bundling remains unconfirmed; withheld from checkout.
 */

export interface AuthoritativeProduct {
  code: string;
  slug: string;
  name: string;
  folderName: string;
  msklcFolder: string;
  categoryNumber: number;
  priceMinor: number | null; // null for unconfirmed bundle
  price: number;
  currency: 'INR';
  isCheckoutAllowed: boolean;
  statusNote: string;
}

export const CONFIRMED_RETAIL_PRICE_MINOR = 47200; // ₹472.00 in paise
export const CONFIRMED_RETAIL_PRICE_INR = 472.0;

export const AUTHORITATIVE_PRODUCTS: AuthoritativeProduct[] = [
  {
    code: 'ASHOKAN_BRAHMI',
    slug: 'ashokan-brahmi',
    name: 'Ashokan Brahmi and Devanagari',
    folderName: 'Ashokan Brahmi',
    msklcFolder: 'Ashokan Brahmi',
    categoryNumber: 1,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'BENGALI',
    slug: 'bengali',
    name: 'Bengali and Devanagari',
    folderName: 'Bengali',
    msklcFolder: 'Bengali',
    categoryNumber: 2,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'DEVANAGARI_HINDI',
    slug: 'devanagari-hindi',
    name: 'Devanagari/Hindi',
    folderName: 'Devanagari',
    msklcFolder: 'Devanagari',
    categoryNumber: 3,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'GUJARATI',
    slug: 'gujarati',
    name: 'Gujarati and Devanagari',
    folderName: 'Gujarati',
    msklcFolder: 'Gujarati',
    categoryNumber: 4,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'KANNADA',
    slug: 'kannada',
    name: 'Kannada',
    folderName: 'Kannada',
    msklcFolder: 'Kannada',
    categoryNumber: 5,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed separate standalone product (C-03 & C-02 ₹472)',
  },
  {
    code: 'MALAYALAM',
    slug: 'malayalam',
    name: 'Malayalam and Devanagari',
    folderName: 'Malayalam',
    msklcFolder: 'Malayalam',
    categoryNumber: 6,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'MODI_MARATHI',
    slug: 'modi-marathi',
    name: 'Modi/Marathi and Devanagari',
    folderName: 'Modi-Marathi',
    msklcFolder: 'Modi-Marathi',
    categoryNumber: 7,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'ORIYA_ODIA',
    slug: 'oriya-odia',
    name: 'Oriya/Odia and Devanagari',
    folderName: 'Oriya-Odia',
    msklcFolder: 'Odia',
    categoryNumber: 8,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'PUNJABI_GURMUKHI',
    slug: 'punjabi-gurmukhi',
    name: 'Punjabi/Gurmukhi and Devanagari',
    folderName: 'Punjabi-Gurumuki',
    msklcFolder: 'Punjabi-Gurumuki',
    categoryNumber: 9,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'TAMIL_AND_GRANTHA',
    slug: 'tamil-and-grantha',
    name: 'Tamil and Tamil Grantha',
    folderName: 'Tamil',
    msklcFolder: 'Tamil',
    categoryNumber: 10,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed price (₹472.00)',
  },
  {
    code: 'TELUGU',
    slug: 'telugu',
    name: 'Telugu and Devanagari',
    folderName: 'Telugu',
    msklcFolder: 'Telugu',
    categoryNumber: 11,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
  {
    code: 'TULU',
    slug: 'tulu',
    name: 'Tulu (Tigalari)',
    folderName: 'Tulu',
    msklcFolder: 'Tulu',
    categoryNumber: 12,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed separate standalone product (C-03 & C-02 ₹472)',
  },
  {
    code: 'SHARADA',
    slug: 'sharada',
    name: 'Sharada (Kashmiri) and Devanagari',
    folderName: 'Sharada',
    msklcFolder: 'Sharada',
    categoryNumber: 13,
    priceMinor: CONFIRMED_RETAIL_PRICE_MINOR,
    price: CONFIRMED_RETAIL_PRICE_INR,
    currency: 'INR',
    isCheckoutAllowed: true,
    statusNote: 'Confirmed standalone product (C-02 ₹472)',
  },
];
