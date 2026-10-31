/**
 * Contact Information Content
 * Agreement Reference: §02 p4 (PG-08), §02 p5 (FT-20)
 * References: docs/production/01 §1, docs/production/14 (C-10, C-17, C-34)
 */

export interface ContactContent {
  title: string;
  subtitle: string;
  contactDetails: {
    proprietor: string;
    organization: string;
    location: string;
    officialEmail: string;
    phone: string;
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
    officialEmail: 'support@brahmicomputing.in',
    phone: '9632819063',
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
    'Official support mailbox: support@brahmicomputing.in. Phone: 9632819063. Operational relay is active via Resend transport.',
};
