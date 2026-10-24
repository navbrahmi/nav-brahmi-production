/**
 * Contact Information Content
 * Agreement Reference: §02 p4 (PG-08), §02 p5 (FT-20)
 * References: docs/production/01 §1, docs/production/14 (C-17, C-34)
 */

export interface ContactContent {
  title: string;
  subtitle: string;
  contactDetails: {
    proprietor: string;
    organization: string;
    location: string;
    officialEmail: string;
    phonePendingNotice: string;
    hours: string;
  };
  form: {
    title: string;
    description: string;
    fields: {
      nameLabel: string;
      emailLabel: string;
      subjectLabel: string;
      messageLabel: string;
    };
    submitLabel: string;
    successMessage: string;
    errorMessage: string;
  };
  openDecisionNotice: string;
}

export const contactContent: ContactContent = {
  title: 'Contact Nav Brahmi',
  subtitle:
    'Get in touch with the Nav Brahmi team for inquiries regarding Indian language keyboard drivers, academic licensing, or technical assistance.',
  contactDetails: {
    proprietor: 'Naveen Jayachandra (Proprietor)',
    organization: 'NAV BRAHMI',
    location: 'Bengaluru, Karnataka, India',
    officialEmail: 'navbrahmi@gmail.com',
    phonePendingNotice:
      'PLACEHOLDER: Official public phone number pending client confirmation between visiting card and agreement (C-17)',
    hours: 'Monday to Friday, 9:30 AM – 6:00 PM IST',
  },
  form: {
    title: 'Send a Message',
    description:
      'Please fill out the form below. Inquiries will be relayed directly to the official Nav Brahmi administrative mailbox.',
    fields: {
      nameLabel: 'Full Name',
      emailLabel: 'Email Address',
      subjectLabel: 'Subject or Language Category',
      messageLabel: 'Your Message or Inquiry',
    },
    submitLabel: 'Send Message',
    successMessage: 'Thank you. Your message has been received and our team will get back to you shortly.',
    errorMessage: 'Unable to send your message. Please check the required fields or email us directly.',
  },
  openDecisionNotice:
    'PLACEHOLDER: Final email delivery provider integration pending client mailbox configuration (C-11, C-12)',
};
