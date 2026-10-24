/**
 * Home Page Content
 * Source: Client Manuals (verified text)
 * References: docs/production/01-project-context-and-requirements.md §10, docs/production/13 §3
 */

export interface HomePageContent {
  hero: {
    title: string;
    description: string;
    taglineNotice: string;
  };
  about: {
    heading: string;
    body: string[];
    approvalNotice: string;
  };
  vision: {
    heading: string;
    body: string[];
  };
  mission: {
    heading: string;
    body: string[];
  };
  overview: {
    heading: string;
    body: string;
    statSummary: {
      categoriesCount: number;
      productsDelivered: number;
      operatingSystem: string;
      standard: string;
    };
  };
  motifGrid: {
    heading: string;
    subheading: string;
  };
}

export const homeContent: HomePageContent = {
  hero: {
    title: 'Nav Brahmi',
    description:
      'Native Windows keyboard layout drivers and Unicode typography for classical and modern Indian scripts.',
    // Taglines in client delivery: "Indic Language Typing, Made Easy!" vs "Your Language, Your Typing, Made Easy"
    // Per instructions: withhold official tagline display until C-33 is confirmed
    taglineNotice: 'PLACEHOLDER: Official tagline pending client selection between manual and logo variants (C-33)',
  },
  about: {
    heading: 'About Nav Brahmi',
    body: [
      "Nav Brahmi presents India's user-friendly bilingual keyboard designed to make typing in Indian languages simple, fast, and intuitive. The patented BRAHMI Keyboard allows users to type seamlessly in Indic languages of their choice using a single keyboard layout.",
      'The BRAHMI Keyboard is fully Unicode-compliant and works across all Windows applications that support text input, enabling users to type effortlessly in documents, presentations, web browsers, and other software. Designed with simplicity and ease of use in mind.',
    ],
    approvalNotice:
      'PLACEHOLDER: Client formal confirmation of patent citation and manual claims for public marketing copy (C-37)',
  },
  vision: {
    heading: 'Our Vision',
    body: [
      "Indian Languages and Culture in the 21st Century. India's rich linguistic and cultural heritage must thrive in the digital era. To achieve this, Indian languages need to be fully Unicode-compatible and easily accessible through modern technology.",
      'The vast collection of India’s classical literature should be digitized and made available for future generations. Likewise, great literary and scholarly works from around the world should be digitized to make global knowledge more accessible.',
    ],
  },
  mission: {
    heading: 'Our Mission',
    body: [
      'At Nav Brahmi, our mission is to bridge the gap between language and technology, making digital communication in Indian languages simple, inclusive, and accessible for everyone.',
    ],
  },
  overview: {
    heading: 'Overview of Work & Products',
    body:
      'Nav Brahmi provides dedicated, native Microsoft Windows keyboard layout drivers for 13 official language categories, spanning classical epigraphic scripts like Ashokan Brahmi, Sharada, Modi, and Tigalari, as well as major modern Indian languages.',
    statSummary: {
      categoriesCount: 13,
      productsDelivered: 14,
      operatingSystem: 'Microsoft Windows 10 & 11',
      standard: 'Full Unicode Compliance',
    },
  },
  motifGrid: {
    heading: 'Script & Language Catalog',
    subheading:
      'Explore the 13 language categories featuring the authentic 3×3 monitor motif from the official Nav Brahmi identity.',
  },
};
