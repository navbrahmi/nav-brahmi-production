/**
 * Fonts & Resources Content
 * Agreement Reference: §02 p4 (PG-04)
 * References: docs/production/13 §4 (C-29 font licenses)
 */

export interface ResourceItem {
  name: string;
  category: string;
  description: string;
  licenseStatus: string;
  downloadAvailable: boolean;
  notes: string;
}

export interface ResourcesContent {
  title: string;
  subtitle: string;
  complianceNotice: string;
  resources: ResourceItem[];
  missingLinksNotice: string;
}

export const resourcesContent: ResourcesContent = {
  title: 'Fonts & Script Resources',
  subtitle:
    'Guidance on Unicode typography, font licensing, and keyboard resources for Nav Brahmi supported scripts.',
  complianceNotice:
    'Brahmi Computing Technologies confirms ownership or redistribution rights for the bundled fonts delivered inside each respective language folder (C-29). The installer installs only the authorized fonts mapped specifically to the purchased language product.',
  resources: [
    {
      name: 'Google Noto Sans Fonts',
      category: 'Unicode Typefaces',
      description:
        'Comprehensive, high-quality open-source typefaces covering Brahmi, Devanagari, Bengali, Gujarati, Kannada, Malayalam, Odia, Gurmukhi, Tamil, Telugu, and Sharada.',
      licenseStatus: 'SIL Open Font License 1.1 (Open Source)',
      downloadAvailable: true,
      notes: 'Freely available from Google Fonts for commercial and personal publishing.',
    },
    {
      name: 'Proprietary & Custom Script Fonts',
      category: 'Custom Epigraphic Fonts',
      description:
        'Specialized fonts delivered with specific keyboard packages, including custom Tulu Tigalari and Tamil Grantha font suites.',
      licenseStatus: 'Confirmed: Brahmi Computing Technologies owns/holds redistribution rights (C-29)',
      downloadAvailable: false,
      notes: 'Installed selectively and persistently by the setup bootstrapper for the purchased language product only.',
    },
    {
      name: 'Keyboard Layout Documentation & Stickers',
      category: 'User Reference Guides',
      description:
        'Official printable PDF keyboard stickers and user instruction manuals accompanying each language driver.',
      licenseStatus: 'Proprietary © Nav Brahmi',
      downloadAvailable: false,
      notes: 'Included with authorized software purchase packages.',
    },
  ],
  missingLinksNotice:
    'PLACEHOLDER: Verified public download links for external font archives pending client confirmation (C-17, C-29)',
};
