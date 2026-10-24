/**
 * FAQ & Help Content
 * Reference: docs/production/14-client-inputs-and-open-decisions.md (C-17)
 */

export interface FAQItem {
  question: string;
  answer: string;
  isPlaceholder?: boolean;
}

export interface FAQCategory {
  title: string;
  items: FAQItem[];
}

export const faqContent: {
  title: string;
  subtitle: string;
  categories: FAQCategory[];
} = {
  title: 'Frequently Asked Questions & Support',
  subtitle:
    'Find answers to common questions about Nav Brahmi keyboard drivers, licensing, and installation.',
  categories: [
    {
      title: 'General Information & Compatibility',
      items: [
        {
          question: 'What is Nav Brahmi?',
          answer:
            "Nav Brahmi presents India's user-friendly bilingual keyboard layouts designed for effortless typing in classical and modern Indian languages on Microsoft Windows.",
        },
        {
          question: 'Which operating systems are supported?',
          answer:
            'Nav Brahmi keyboard drivers are built for Microsoft Windows 10 and Windows 11 (64-bit and 32-bit editions). ARM64 and non-Windows operating systems are not currently supported.',
        },
        {
          question: 'Do I need special typing software or third-party background tools to type?',
          answer:
            'No. Nav Brahmi drivers install natively as official Windows keyboard layouts via Microsoft MSKLC technology. Once installed, they integrate directly into the Windows Language Bar.',
        },
      ],
    },
    {
      title: 'Licensing & Activation',
      items: [
        {
          question: 'How does software activation work?',
          answer:
            'Each purchased license is issued with a unique license key. The setup bootstrapper verifies your license and binds the software installation to your authorized computer.',
        },
        {
          question: 'How many computers can I use my license on?',
          answer:
            'PLACEHOLDER: Awaiting client policy on maximum machine activations per license and machine replacement rules (C-07)',
        },
        {
          question: 'How do I recover my license if I lose my purchase email?',
          answer:
            'You can retrieve your registered license key and access authorized downloads anytime using the self-service License Recovery tool on this website with your purchase email address.',
        },
      ],
    },
    {
      title: 'Delivery, Pricing & Invoices',
      items: [
        {
          question: 'What is the price of each keyboard layout package?',
          answer:
            'PLACEHOLDER: Official retail price per package pending client confirmation (Manuals state ₹480 tax-inclusive vs invoice template calculation ₹472) (C-02)',
        },
        {
          question: 'How are digital goods and documentation delivered?',
          answer:
            'Upon purchase, your license key and download link are generated and emailed to your purchase address. User manuals and keyboard stickers are provided in digital PDF formats.',
        },
        {
          question: 'What is the refund and cancellation policy?',
          answer:
            'PLACEHOLDER: Awaiting client confirmation of formal refund and dispute policy for digital software licenses (C-08, C-18)',
        },
      ],
    },
  ],
};
