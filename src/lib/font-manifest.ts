/**
 * Product-Specific Font Manifest & Allowlist (C-29)
 *
 * Implements confirmed client decision C-29:
 * 1. Brahmi Computing Technologies owns or holds redistribution rights for the delivered fonts.
 * 2. Each font is strictly associated with its corresponding individual language package.
 * 3. Never mix fonts across languages (e.g. Kannada with Tulu).
 * 4. Wildcard font installation is strictly prohibited.
 * 5. Only approved fonts belonging to the selected product are installed.
 * 6. Uninstall/rollback and persistent Win32 font registration supported.
 */

export interface ProductFontDefinition {
  productSlug: string;
  productCode: string;
  languageName: string;
  approvedFonts: string[];
}

export const PRODUCT_FONT_MANIFEST: Record<string, ProductFontDefinition> = {
  kannada: {
    productSlug: 'kannada',
    productCode: 'KANNADA',
    languageName: 'Kannada',
    approvedFonts: ['NotoSansKannada-RegularNJ.ttf'],
  },
  tulu: {
    productSlug: 'tulu',
    productCode: 'TULU',
    languageName: 'Tulu (Tigalari)',
    approvedFonts: ['Brahmi_Tulu_Tigalari_Refined_Regular-refined.ttf'],
  },
  'ashokan-brahmi': {
    productSlug: 'ashokan-brahmi',
    productCode: 'ASHOKAN_BRAHMI',
    languageName: 'Ashokan Brahmi',
    approvedFonts: ['NotoSansBrahmi-Regular.ttf'],
  },
  'devanagari-hindi': {
    productSlug: 'devanagari-hindi',
    productCode: 'DEVANAGARI_HINDI',
    languageName: 'Devanagari / Hindi',
    approvedFonts: [
      'Gargi.ttf',
      'Lohit-Devanagari.ttf',
      'Chandas.ttf',
      'NotoSansDevanagari-Regular.ttf',
      'NotoSansDevanagari-Bold.ttf',
      'NotoSansDevanagari_SemiCondensed-ExtraLight.ttf',
      'NotoSansDevanagari_ExtraCondensed-Medium.ttf',
    ],
  },
  gujarati: {
    productSlug: 'gujarati',
    productCode: 'GUJARATI',
    languageName: 'Gujarati',
    approvedFonts: [
      'NotoSansGujarati-Regular.ttf',
      'NotoSansGujarati-Bold.ttf',
      'NotoSansGujarati_SemiCondensed-Medium.ttf',
      'NotoSansGujarati-Light.ttf',
      'NotoSansGujarati_Condensed-Regular.ttf',
    ],
  },
  malayalam: {
    productSlug: 'malayalam',
    productCode: 'MALAYALAM',
    languageName: 'Malayalam',
    approvedFonts: [
      'RaghuMalayalamSans-Regular.ttf',
      'Rachana-Regular.ttf',
      'Keraleeyam-Regular.ttf',
      'Rachana-Bold.ttf',
      'Suruma.ttf',
      'Meera-Regular.ttf',
      'Karumbi-Regular.ttf',
      'Kartika.ttf',
      'AnjaliOldLipi-Regular.ttf',
      'Samyak-Malayalam.ttf',
      'Uroob-Regular.ttf',
      'Lohit-Malayalam.ttf',
      'Dyuthi-Regular.ttf',
    ],
  },
  'modi-marathi': {
    productSlug: 'modi-marathi',
    productCode: 'MODI_MARATHI',
    languageName: 'Modi / Marathi',
    approvedFonts: ['NotoSansModi-Regular.ttf'],
  },
  'oriya-odia': {
    productSlug: 'oriya-odia',
    productCode: 'ORIYA_ODIA',
    languageName: 'Odia',
    approvedFonts: [
      'NotoSansOriya-Regular.ttf',
      'NotoSansOriya-Bold.ttf',
      'NotoSansOriya-Medium.ttf',
      'NotoSansOriya-SemiBold.ttf',
    ],
  },
  'punjabi-gurmukhi': {
    productSlug: 'punjabi-gurmukhi',
    productCode: 'PUNJABI_GURMUKHI',
    languageName: 'Punjabi (Gurmukhi)',
    approvedFonts: [
      'NotoSansGurmukhi-Regular.ttf',
      'NotoSansGurmukhi-Bold.ttf',
      'NotoSansGurmukhi-Medium.ttf',
      'NotoSansGurmukhi-SemiBold.ttf',
    ],
  },
  sharada: {
    productSlug: 'sharada',
    productCode: 'SHARADA',
    languageName: 'Sharada',
    approvedFonts: ['NotoSansSharada-Regular.ttf'],
  },
  telugu: {
    productSlug: 'telugu',
    productCode: 'TELUGU',
    languageName: 'Telugu',
    approvedFonts: [
      'Lohit-Telugu.ttf',
      'NotoSansTelugu-Regular.ttf',
      'NotoSansTelugu-Bold.ttf',
      'NotoSansTelugu-Medium.ttf',
    ],
  },
  bengali: {
    productSlug: 'bengali',
    productCode: 'BENGALI',
    languageName: 'Bengali',
    approvedFonts: [
      'muktinarrow.ttf',
      'MitraMono.ttf',
      'Ani.ttf',
      'Mitra.ttf',
      'JamrulNormal.ttf',
      'muktinarrowbold.ttf',
      'Muktibold.ttf',
      'LikhanNormal.ttf',
      'LaboratIN-Bengali.ttf',
      'Mukti.ttf',
      'Lohit-Bengali.ttf',
    ],
  },
  tamil: {
    productSlug: 'tamil',
    productCode: 'TAMIL',
    languageName: 'Tamil',
    approvedFonts: [
      'Lohit-Tamil.ttf',
      'Samyak-Tamil.ttf',
      'LaboratIN-Tamil.ttf',
      'Maduram.ttf',
      'NotoSansTamil-Regular.ttf',
      'NotoSansTamil-Bold.ttf',
    ],
  },
  'tamil-grantha': {
    productSlug: 'tamil-grantha',
    productCode: 'TAMIL_GRANTHA',
    languageName: 'Tamil Grantha',
    approvedFonts: [
      'NotoSerifGrantha-Regular.ttf',
      'Grantham Roman.ttf',
      'Grantham Bold.ttf',
      'GranthamLight.ttf',
      'GranthamOutline.ttf',
      'GranthamLightCondensed.ttf',
      'grantha-sangam-mn-regular.otf',
      'grantha-sangam-mn-bold.otf',
    ],
  },
  'tamil-and-grantha': {
    productSlug: 'tamil-and-grantha',
    productCode: 'TAMIL_AND_GRANTHA',
    languageName: 'Tamil & Tamil Grantha (Unresolved Bundle)',
    approvedFonts: [
      'Lohit-Tamil.ttf',
      'NotoSansTamil-Regular.ttf',
      'NotoSerifGrantha-Regular.ttf',
      'Grantham Roman.ttf',
    ],
  },
  legacy: {
    productSlug: 'legacy',
    productCode: 'LEGACY',
    languageName: 'Legacy / Test Fallback',
    approvedFonts: ['navbrahmi-regular.ttf', 'navbrahmi-bold.ttf'],
  },
};

/**
 * Normalizes product identifier (slug, code, or name) to manifest key
 */
export function normalizeProductKey(identifier: string): string {
  if (!identifier) return '';
  return identifier.toLowerCase().trim().replace(/_/g, '-');
}

/**
 * Returns the list of approved font filenames for a specific product.
 * Returns empty array for unknown products to prevent unauthorized installation.
 */
export function getProductApprovedFonts(productIdentifier: string): string[] {
  const key = normalizeProductKey(productIdentifier);
  const entry = PRODUCT_FONT_MANIFEST[key];
  if (entry) {
    return [...entry.approvedFonts];
  }
  return [];
}

/**
 * Validates whether a specific font filename is approved for a given product.
 * Prevents cross-language font pollution (e.g. Kannada fonts in Tulu).
 */
export function isFontApprovedForProduct(productIdentifier: string, fontFileName: string): boolean {
  if (!productIdentifier || !fontFileName) return false;
  const approved = getProductApprovedFonts(productIdentifier);
  const targetBase = fontFileName.trim().toLowerCase();
  return approved.some((f) => f.toLowerCase() === targetBase);
}

/**
 * Validates a list of candidate font files against the product manifest.
 * Separates approved fonts from unapproved/cross-language fonts.
 */
export function validatePackageFonts(
  productIdentifier: string,
  candidateFontFiles: string[]
): {
  approved: string[];
  rejected: string[];
} {
  const approvedList = getProductApprovedFonts(productIdentifier);
  const approved: string[] = [];
  const rejected: string[] = [];

  for (const candidate of candidateFontFiles) {
    const baseName = candidate.split(/[\\/]/).pop() || candidate;
    const isApproved = approvedList.some((f) => f.toLowerCase() === baseName.toLowerCase());
    if (isApproved) {
      approved.push(baseName);
    } else {
      rejected.push(baseName);
    }
  }

  return { approved, rejected };
}

// Convenient aliases for API consistency
export const getApprovedFontsForProduct = getProductApprovedFonts;
export const filterApprovedFontsForProduct = validatePackageFonts;
