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
            'The supported target is Windows 11, 64-bit (x64) systems using Intel or AMD processors on Windows versions within Microsoft’s supported servicing lifecycle. Compatible device categories include Windows 11 desktops, laptops, workstations, and x64 tablets. Windows 10 is unsupported as standard Microsoft support has ended. Windows on ARM (ARM64, including Snapdragon devices), 32-bit Windows, Windows 11 S mode, macOS, Linux, ChromeOS, iOS, and Android are unsupported. (Note: Runtime package installation is implemented and pending manual Windows verification).',
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
            'Each license allows one active machine binding. If your hardware fails or you replace your computer, machine replacement is handled securely via customer support (support@brahmicomputing.in). Support verifies purchase ownership before authorizing a reset. A 90-day cooldown applies between transfers, and previous machine activations are invalidated upon reset. Public self-service deactivation is not permitted.',
        },
        {
          question: 'What is the licensing scope and protection boundary?',
          answer:
            'Licensing protection applies to purchase authorization, license generation, one-machine activation, authorized package downloads, and installer execution. Installed MSKLC keyboard layouts integrate natively with Windows and are not modified with runtime DRM or background monitoring tools.',
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
            'The confirmed retail price is ₹472 per individual language package (inclusive; no additional taxes are added at checkout). Kannada and Tulu are distinct standalone products.',
        },
        {
          question: 'How are digital goods and documentation delivered?',
          answer:
            'Upon purchase, your license key and download link are generated and emailed to your purchase address. User manuals and keyboard stickers are provided in digital PDF formats.',
        },
        {
          question: 'What is the refund and cancellation policy?',
          answer:
            'Customers may apply for a refund within 7 calendar days of successful software installation if they experience a serious software bug or significant functional issue affecting core typing functionality. Refund requests are submitted through your order reference page and manually reviewed by support. Submitting a request does not automatically issue a refund or revoke your license; approved refunds are processed manually via Razorpay.',
        },
      ],
    },
  ],
};
