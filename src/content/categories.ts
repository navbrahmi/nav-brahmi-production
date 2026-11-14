/**
 * 13 Agreement Categories mapped to the 14 delivered packages
 * Source: Signed Agreement §02 and Client Delivery (Kreovi-NavBrahmi2026-10-17.zip)
 * Reference: docs/production/13-product-catalog-and-package-matrix.md
 */

export interface ProductManual {
  title: string;
  filename: string;
  url: string;
  size: string;
}

export interface ProductCategory {
  id: string;
  categoryNumber: number;
  agreementName: string;
  slug: string;
  deliveredFolders: string[];
  scriptName: string;
  bcp47Tag: string;
  iso15924: string;
  defaultFont: string;
  specimenGlyphs: string;
  specimenSource: 'CLIENT_MANUAL' | 'UNSUPPLIED';
  logoSvg: string;
  overview: string;
  features: string[];
  specifications: {
    architecturesDelivered: string[];
    supportedWindows: string;
    inputMethod: string;
    encoding: string;
    shortcut: string;
  };
  images: string[];
  manuals: ProductManual[];
  openQuestions?: string[];
  screenshots?: string;
  videos?: string;
  fontLinks?: string;
  manualAsset: string;
  stickerAsset: string;
}

export const productCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    categoryNumber: 1,
    agreementName: 'Ashokan Brahmi',
    slug: 'ashokan-brahmi',
    deliveredFolders: ['Ashokan Brahmi'],
    scriptName: 'Ashokan Brahmi',
    bcp47Tag: 'pra-Brah',
    iso15924: 'Brah',
    defaultFont: 'Noto Sans Brahmi',
    specimenGlyphs: '𑀦𑀯 𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-AshokanBrahmi-IndicLanguageTypingMadeEasy-object.svg',
    overview:
      'Brāhmī (𑀩𑁆𑀭𑀸𑀳𑁆𑀫𑀻), an ancient Indian abugida, appears as a fully developed writing system by the 3rd century BCE, with its best-known examples found in the rock-cut edicts of Ashoka. Over the centuries, Brāhmī underwent gradual development before diversifying into regional forms from around the 6th century CE, giving rise to the Brāhmīc family of scripts used across South and Southeast Asia today. The Ashokan Brāhmī driver uses Sanskrit as the basis for its keyboard design, following the traditional structural order of vowels and consonants.',
    features: [
      'Row 1 (Number Row): Vowel set mapping (𑀅 𑀆 𑀇 𑀈 𑀉 𑀊 𑀋 𑀌 𑀏 𑀐 𑀑 𑀒 𑀁)',
      'Row 2 (QWERTY Row): Initial consonant series (𑀓 𑀔 𑀕 𑀖 𑀗 | 𑀘 𑀙 𑀚 𑀛 𑀜)',
      'Row 3 (Home Row): Consonant series with dedicated virama (𑁆) positioning',
      'System-wide Unicode text input across all Windows applications',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode 7.0+ (Brahmi Block U+11000–U+1107F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/ashokan-brahmi.png'],
    manuals: [
      {
        title: 'Ashokan Brahmi User Manual',
        filename: 'AshokanBrahmi-Manual.pdf',
        url: '/manuals/AshokanBrahmi-Manual.pdf',
        size: '522 KB',
      },
    ],
    manualAsset: 'AshokanBrahmi-Manual.pdf',
    stickerAsset: 'Ashokan-Brahmi-Sticker.pdf',
  },
  {
    id: 'cat-2',
    categoryNumber: 2,
    agreementName: 'Bengali',
    slug: 'bengali',
    deliveredFolders: ['Bengali'],
    scriptName: 'Bengali',
    bcp47Tag: 'bn-Beng',
    iso15924: 'Beng',
    defaultFont: 'Noto Sans Bengali',
    specimenGlyphs: 'নব ব্রাহ্মী',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Bengali-IndicLanguageTypingMadeEasy-Object.svg',
    overview:
      'The Bengali script, or Bangla alphabet, is the standard writing system used for the Bengali language and is historically associated with Sanskrit in Bengal. Descended from the ancient Brahmi script, Bengali is written from left to right and functions as an abugida, recognised by its distinctive horizontal headline, or matra, which connects the characters. Its rich writing system incorporates vowels, consonants, conjunct consonants, numerals, and punctuation, reflecting centuries of linguistic and cultural development.',
    features: [
      'Phonetically organized Bengali conjunct and vowel input',
      'Seamless switching between English and Bengali using standard shortcut',
      'Full compatibility with word processors, browsers, and design software',
      'Native MSKLC Windows driver installation',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Bengali Block (U+0980–U+09FF)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/bengali.png'],
    manuals: [
      {
        title: 'Bengali User Manual',
        filename: 'Bengali-Manual.pdf',
        url: '/manuals/Bengali-Manual.pdf',
        size: '945 KB',
      },
    ],
    manualAsset: 'Bengali-Manual.pdf',
    stickerAsset: 'Bengali-Sticker.pdf',
  },
  {
    id: 'cat-3',
    categoryNumber: 3,
    agreementName: 'Devanagari/Hindi',
    slug: 'devanagari-hindi',
    deliveredFolders: ['Devanagari'],
    scriptName: 'Devanagari / Hindi',
    bcp47Tag: 'hi-Deva',
    iso15924: 'Deva',
    defaultFont: 'Noto Sans Devanagari',
    specimenGlyphs: 'नव ब्राह्मी',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-नव् ब्राह्मी-Devanagari-IndicLanguageTypingMadeEasy-Objects.svg',
    overview:
      'Devanāgarī is a left-to-right abugida of the Brahmic family, descended from ancient Brāhmī and developed from the Nāgarī tradition, reaching its modern form around the 11th century. One of the principal scripts of India and Nepal, it is widely used for Sanskrit, Hindi, Marathi, Nepali, Pāḷi, Konkani, and numerous other languages. Recognisable by its distinctive horizontal śirorekhā or headline, Devanāgarī follows a largely phonetic and systematic arrangement of vowels and consonants expressing the structure of speech.',
    features: [
      'Varnamala-ordered consonant and vowel keystrokes',
      'Accurate halant (virama), matra, and conjunct formation',
      'Compatible with Microsoft Office, Adobe Creative Cloud, and web browsers',
      'Includes architecture-specific Windows installation packages',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Devanagari Block (U+0900–U+097F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/devanagari.png'],
    manuals: [
      {
        title: 'Devanagari / Hindi User Manual',
        filename: 'Devanagari-Manual.pdf',
        url: '/manuals/Devanagari-Manual.pdf',
        size: '956 KB',
      },
    ],
    manualAsset: 'Devanagari-Manual.pdf',
    stickerAsset: 'Devanagari-Sticker.pdf',
  },
  {
    id: 'cat-4',
    categoryNumber: 4,
    agreementName: 'Gujarati',
    slug: 'gujarati',
    deliveredFolders: ['Gujarati'],
    scriptName: 'Gujarati',
    bcp47Tag: 'gu-Gujr',
    iso15924: 'Gujr',
    defaultFont: 'Noto Sans Gujarati',
    specimenGlyphs: 'નવ બ્રાહ્મી',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Gujarati-IndicLanguageTypingMadeEasy-object.svg',
    overview:
      'The Gujarati script (Gujarātī lipi) is an Indic abugida used primarily for writing Gujarati and Kutchi, and is one of the official scripts of India. Evolving from the Nagari tradition through three broad stages between the 10th and 19th centuries, it evolved into a practical form distinguished from Devanagari by the absence of the horizontal headline (śirorekhā) and modifications to several characters. Historically known as Śarāphī, Vāṇiāśāī, or Mahājanī, it retains the fundamental Indic abugida structure.',
    features: [
      'Intuitive Gujarati vowel signs, matras, and conjunct formation',
      'Works in all Windows text fields and applications',
      'Simple toggle between English and Gujarati',
      'Standard MSKLC driver delivery',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Gujarati Block (U+0A80–U+0AFF)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/gujarati.png'],
    manuals: [
      {
        title: 'Gujarati User Manual',
        filename: 'Gujarathi-Manual.pdf',
        url: '/manuals/Gujarathi-Manual.pdf',
        size: '923 KB',
      },
    ],
    manualAsset: 'Gujarati-Manual.pdf',
    stickerAsset: 'Gujarati-Sticker.pdf',
  },
  {
    id: 'cat-5',
    categoryNumber: 5,
    agreementName: 'Kannada',
    slug: 'kannada',
    deliveredFolders: ['Kannada'],
    scriptName: 'Kannada',
    bcp47Tag: 'kn-Knda',
    iso15924: 'Knda',
    defaultFont: 'Noto Sans Kannada',
    specimenGlyphs: 'ನವ್ ಬ್ರಾಹ್ಮಿ',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-ನವ್ ಬ್ರಾಹ್ಮಿ-Kannada-IndicLanguageTypingMadeEasy-Objects.svg',
    overview:
      'The Kannaḍa script/lipi is a member of the Brahmic family of writing systems and serves as the primary script for Kannada, a major Dravidian language spoken in Karnataka, India, while also being used for Sanskrit, Tulu, Konkani, Kodava, Beary, and Sanketi. Comprising 49 letters, the script is a phonemic abugida tracing its origins to ancient Brahmi through the early Kadamba tradition and Chalukya period, preserving distinct character forms and orthographic conventions.',
    features: [
      'Native Kannada ottakshara (conjunct) and matra input logic',
      'System-wide integration with Windows language bar',
      'Designed for administrative, academic, and publishing workflows',
      'Supports Windows 11 (64-bit x64)',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Kannada Block (U+0C80–U+0CFF)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/kannada.png'],
    manuals: [
      {
        title: 'Kannada User Manual',
        filename: 'Kannada-Manual2026-11-05.pdf',
        url: '/manuals/Kannada-Manual2026-11-05.pdf',
        size: '1.0 MB',
      },
    ],
    manualAsset: 'Kannada-Manual.pdf',
    stickerAsset: 'Kannada-Sticker.pdf',
  },
  {
    id: 'cat-6',
    categoryNumber: 6,
    agreementName: 'Malayalam',
    slug: 'malayalam',
    deliveredFolders: ['Malayalam'],
    scriptName: 'Malayalam',
    bcp47Tag: 'ml-Mlym',
    iso15924: 'Mlym',
    defaultFont: 'Noto Sans Malayalam',
    specimenGlyphs: 'നവ് ബ്രാഹ്മി',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-നവ് ബ്രാഹ്മി-MalayalamLanguageTypingMadeEasy-Objects.svg',
    overview:
      'The Malayalam script (Malayāḷa lipi) is a Brahmic abugida used to write Malayalam, a major Dravidian language spoken primarily in Kerala. Evolving from the ancient Vatteluttu and Grantha scripts, its development reflects the rich linguistic and cultural heritage of southern India. Closely related to the Tigalari script, Malayalam features independent vowels, consonants, dependent vowel signs, and diacritics, supporting both traditional (Pazhaya Lipi) and reformed (Puthiya Lipi) orthography.',
    features: [
      'Effortless typing of traditional and reformed Malayalam orthography',
      'Dedicated handling for chillaksharam and chandrakkala (virama)',
      'Full integration across Microsoft Office and browser environments',
      'Architecture-specific MSI installation',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Malayalam Block (U+0D00–U+0D7F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/malayalam.png'],
    manuals: [
      {
        title: 'Malayalam User Manual',
        filename: 'Malayalam-Manual.pdf',
        url: '/manuals/Malayalam-Manual.pdf',
        size: '961 KB',
      },
    ],
    manualAsset: 'Malayalam-Manual.pdf',
    stickerAsset: 'Malayalam-Sticker.pdf',
  },
  {
    id: 'cat-7',
    categoryNumber: 7,
    agreementName: 'Modi/Marathi',
    slug: 'modi-marathi',
    deliveredFolders: ['Modi-Marathi'],
    scriptName: 'Modi / Marathi',
    bcp47Tag: 'mr-Modi',
    iso15924: 'Modi',
    defaultFont: 'Noto Sans Modi',
    specimenGlyphs: '𑘡𑘪 𑘤𑘿𑘨𑘰𑘮𑘿𑘦𑘲',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Modi-Marathi-IndicLanguageTypingMadeEasy-Object.svg',
    overview:
      'Mōḍī is an old handwritten cursive Brahmic script used primarily to write Marathi in Maharashtra, alongside Devanāgarī, especially for administration, commerce, accounts, and correspondence during the Maratha and Peshwa periods. Descending from the Nāgarī family, it developed as a fluid continuous-writing form with distinctive letterforms, ligatures, and a continuous headstroke across words, spanning historical styles from the Yādava era through the Shivaji, Peshwa, and Anglakalin periods.',
    features: [
      'Authentic Unicode Modi script mapping (U+11600–U+1165F)',
      'Enables digital transcription of historical Maratha-era documents',
      'Phonetically aligned with Marathi sound structure',
      'Works in all modern Windows text applications',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Modi Block (U+11600–U+1165F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/modi-marathi.png'],
    manuals: [
      {
        title: 'Modi / Marathi User Manual',
        filename: 'Modi-Marathi--Manual.pdf',
        url: '/manuals/Modi-Marathi--Manual.pdf',
        size: '487 KB',
      },
    ],
    manualAsset: 'Modi-Marathi-Manual.pdf',
    stickerAsset: 'Modi-Marathi-Sticker.pdf',
  },
  {
    id: 'cat-8',
    categoryNumber: 8,
    agreementName: 'Oriya/Odia',
    slug: 'oriya-odia',
    deliveredFolders: ['Oriya-Odia'],
    scriptName: 'Odia',
    bcp47Tag: 'or-Orya',
    iso15924: 'Orya',
    defaultFont: 'Noto Sans Oriya',
    specimenGlyphs: 'ନବ ବ୍ରାହ୍ମୀ',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Oriya-IndicLanguageTypingMadeEasy-objects.svg',
    overview:
      'The Odia script (Oṛiā Akṣara) is a Brahmic writing system primarily used to write the Odia language, the official language of Odisha, and is also used for Sanskrit and regional languages. Evolving over more than a thousand years from a variant of the Siddham script, its distinctive rounded letterforms and characteristic umbrella-shaped curves emerge largely from the historical practice of writing on palm leaves, which are easily damaged by straight strokes.',
    features: [
      'Logical placement of Odia vowels and consonants',
      'Direct input into desktop word processors and online portals',
      'Reliable halant and yuktakshara formation',
      'Native Windows layout driver',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Odia Block (U+0B00–U+0B7F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/oriya.png'],
    manuals: [
      {
        title: 'Odia / Oriya User Manual',
        filename: 'Oriya-Manual.pdf',
        url: '/manuals/Oriya-Manual.pdf',
        size: '1.0 MB',
      },
    ],
    manualAsset: 'Oriya-Manual.pdf',
    stickerAsset: 'Oriya-Sticker.svg',
  },
  {
    id: 'cat-9',
    categoryNumber: 9,
    agreementName: 'Punjabi/Gurmukhi',
    slug: 'punjabi-gurmukhi',
    deliveredFolders: ['Punjabi-Gurumuki'],
    scriptName: 'Gurmukhi',
    bcp47Tag: 'pa-Guru',
    iso15924: 'Guru',
    defaultFont: 'Noto Sans Gurmukhi',
    specimenGlyphs: 'ਨਵ ਬ੍ਰਾਹਮੀ',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Punjabi-IndicLanguageTypingMadeEasy-object.svg',
    overview:
      'The Gurmukhi script is a Brahmic writing system primarily used to write Punjabi and serves as the official script of Punjabi in the Indian state of Punjab. Derived from the Sharada script tradition, Gurmukhi plays a vital role in preserving Sikh religious literature, particularly the Guru Granth Sahib. Its alphabet traditionally comprises 35 original letters, known as Paintī, alongside additional consonants, vowel signs, nasalisation marks, and subscript characters.',
    features: [
      'Systematic mapping for Gurmukhi vowels, consonants, and diacritics (tippi, bindi, addak)',
      'Seamless layout toggling using standard keyboard shortcut',
      'Compatible with Microsoft Office and standard software',
      'Clean MSKLC packaging',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Gurmukhi Block (U+0A00–U+0A7F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/punjabi-gurumukhi.png'],
    manuals: [
      {
        title: 'Punjabi / Gurmukhi User Manual',
        filename: 'Punjabi-Gurumukhi-Manual.pdf',
        url: '/manuals/Punjabi-Gurumukhi-Manual.pdf',
        size: '895 KB',
      },
    ],
    manualAsset: 'Punjabi-Manual.pdf',
    stickerAsset: 'Punjabi-Sticker.pdf',
  },
  {
    id: 'cat-10',
    categoryNumber: 10,
    agreementName: 'Tamil and Tamil Grantha',
    slug: 'tamil-and-grantha',
    deliveredFolders: ['Tamil', 'Tamil Grantha'],
    scriptName: 'Tamil & Tamil Grantha',
    bcp47Tag: 'ta-Taml',
    iso15924: 'Taml',
    defaultFont: 'Noto Sans Tamil & Noto Sans Grantha',
    specimenGlyphs: 'நவ் பிராமி',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-நவ் பிராமி-TamilLanguageTypingMadeEasy-Object.svg',
    overview:
      'The Tamiḻ script is a Brahmic writing system comprising 12 vowels (uyireḻuttu), 18 consonants (meyyeḻuttu), and the special character ஃ (āytha eḻuttu), evolving from ancient Tamil-Brahmi through Pallava and Grantha influences. The Grantha script is a classical South Indian Brahmic script that develops from the Pallava script and is traditionally associated with writing Sanskrit in South India from the 4th century CE onward, reflecting the twin literary and epigraphic traditions of Tamil Nadu.',
    features: [
      'Modern Tamil layout with standard pulli (virama) and uyirmey letters',
      'Grantha script layout for historical and Vedic Sanskrit texts',
      'Windows language bar integration for rapid script toggling',
      'Delivered as two dedicated product packages',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Tamil (U+0B80–U+0BFF) & Grantha (U+11300–U+1137F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/tamil.png', '/images/languages/tamil-grantha.png'],
    manuals: [
      {
        title: 'Tamil User Manual',
        filename: 'Tamil-Manual.pdf',
        url: '/manuals/Tamil-Manual.pdf',
        size: '911 KB',
      },
      {
        title: 'Tamil Grantha User Manual',
        filename: 'Tamil-Grantha-Manual.pdf',
        url: '/manuals/Tamil-Grantha-Manual.pdf',
        size: '726 KB',
      },
    ],
    manualAsset: 'Tamil-Manual.pdf / TamilGrantha-Manual.pdf',
    stickerAsset: 'Tamil-Sticker.pdf / TamilGrantha-Sticker.pdf',
  },
  {
    id: 'cat-11',
    categoryNumber: 11,
    agreementName: 'Telugu',
    slug: 'telugu',
    deliveredFolders: ['Telugu'],
    scriptName: 'Telugu',
    bcp47Tag: 'te-Telu',
    iso15924: 'Telu',
    defaultFont: 'Noto Sans Telugu',
    specimenGlyphs: 'నవ్ బ్రాహ్మి',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-నవ్ బ్రాహ్మి-TeluguLanguageTypingMadeEasy-Objects.svg',
    overview:
      'The Telugu script is a Brahmic writing system used primarily to write Telugu, a Dravidian language spoken in Andhra Pradesh, Telangana, and neighbouring regions, as well as Sanskrit texts. Evolving from ancient Brahmi through Bhattiprolu and Kadamba scripts, Telugu developed alongside Kannada before emerging as a distinct script around the 13th century. The writing system features sixteen vowels with independent and diacritic forms used with consonants to represent syllables.',
    features: [
      'Natural gunintamu (vowel sign) and vattulu (consonant conjunct) typing',
      'Works in all Windows text-enabled programs and web applications',
      'Instant language switching with Windows Key + Spacebar',
      'Native MSKLC Windows driver installation',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Telugu Block (U+0C00–U+0C7F)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/telugu.png'],
    manuals: [
      {
        title: 'Telugu User Manual',
        filename: 'Telugu-Manual.pdf',
        url: '/manuals/Telugu-Manual.pdf',
        size: '928 KB',
      },
    ],
    manualAsset: 'Telugu-Manual.pdf',
    stickerAsset: 'Telugu-Sticker.pdf',
  },
  {
    id: 'cat-12',
    categoryNumber: 12,
    agreementName: 'Tulu (Tigalari)',
    slug: 'tulu',
    deliveredFolders: ['Tulu'],
    scriptName: 'Tulu (Tigalari)',
    bcp47Tag: 'tcy-Tglr',
    iso15924: 'Tglr',
    defaultFont: 'Brahmi Tulu-Tigalari 2026 by Nav Brahmi',
    specimenGlyphs: '𑎡𑎰 𑎪𑎳𑎵𑎱𑎬',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Tulu-LanguageTypingMadeEasy-Object.svg',
    overview:
      'Tulu is a Dravidian language traditionally spoken across Tulu Nadu, encompassing Dakshina Kannada and Udupi in Karnataka and northern Kasaragod in Kerala. Its history extends back many centuries, with early inscriptions and literary works associated with the Tigalari script, a Brahmic script historically used for Tulu and Sanskrit and closely related to the Malayalam script. Tigalari character sets were approved by the Central Institute of Indian Languages in 2021.',
    features: [
      'First-of-its-kind digital typing interface for Tulu Tigalari script',
      'Preserves classical Tulu epigraphic and manuscript traditions',
      'Windows layout driver with standard language bar switching',
      'Custom Tigalari font integration included in delivery',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Tigalari Block (U+11380–U+113DF)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/tulu.png'],
    manuals: [
      {
        title: 'Tulu (Tigalari) User Manual',
        filename: 'Tulu-Tigalari-Manual.pdf',
        url: '/manuals/Tulu-Tigalari-Manual.pdf',
        size: '642 KB',
      },
    ],
    manualAsset: 'Tulu-Manual.pdf',
    stickerAsset: 'Tulu-Sticker.pdf',
  },
  {
    id: 'cat-13',
    categoryNumber: 13,
    agreementName: 'Sharada (Kashmiri)',
    slug: 'sharada',
    deliveredFolders: ['Sharada'],
    scriptName: 'Sharada',
    bcp47Tag: 'ks-Shrd',
    iso15924: 'Shrd',
    defaultFont: 'Noto Sans Sharada',
    specimenGlyphs: '𑆤𑆮 𑆧𑇀𑆫𑆳𑆲𑇀𑆩𑆵',
    specimenSource: 'CLIENT_MANUAL',
    logoSvg: '/logos/Final-Logo-Sharada-IndicLanguageTypingMadeEasy-Objects.svg',
    overview:
      'The Śāradā (also Sarada or Sharada) script is a Brahmic abugida that developed in northwestern South Asia and flourished particularly in Kashmir and neighbouring regions from around the 8th to 12th centuries. Named after Śāradā, the Hindu goddess of learning, it is used primarily for writing Sanskrit and Kashmiri, appearing in historical inscriptions and manuscripts across Kashmir, Punjab, Himachal Pradesh, and ancient Gandhara, including the Bakhshali manuscript.',
    features: [
      'Full Unicode Sharada character and conjunct support (U+11180–U+111DF)',
      'Essential for researchers, universities, and manuscript digital archives',
      'Phonetically structured for intuitive Sanskrit and Kashmiri typing',
      'Standard Windows MSKLC keyboard driver',
    ],
    specifications: {
      architecturesDelivered: ['x64', 'x86', 'ia64'],
      supportedWindows: 'Windows 11 (64-bit x64)',
      inputMethod: 'Native MSKLC Windows Keyboard Layout',
      encoding: 'Unicode Sharada Block (U+11180–U+111DF)',
      shortcut: 'Windows Key + Spacebar',
    },
    images: ['/images/languages/sharada.png'],
    manuals: [
      {
        title: 'Sharada (Kashmiri) User Manual',
        filename: 'Sharada-Manual.pdf',
        url: '/manuals/Sharada-Manual.pdf',
        size: '665 KB',
      },
    ],
    manualAsset: 'Sharada-Manual.pdf',
    stickerAsset: 'Sharada-Sticker.pdf',
  },
];
