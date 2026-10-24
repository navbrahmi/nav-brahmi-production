/**
 * Site-wide configuration and verified metadata
 * Brand palette (client final):
 *   Primary: #E51055
 *   Surface: #FFFFFF
 *   Link:    #0066CC
 * Body-text neutral (provisional token, C-28 flagged for client confirmation):
 *   #231F20
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  domain: string;
  canonicalBase: string;
  navLinks: NavLink[];
  footerLinks: NavLink[];
  contact: {
    proprietor: string;
    city: string;
    stateCountry: string;
    email: string;
    phone: string;
    gstinStatus: string;
  };
  openDecisions: {
    taglineChoice: string;
    neutralTextColor: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'Nav Brahmi',
  domain: 'www.brahmicomputing.in',
  canonicalBase: 'https://www.brahmicomputing.in',
  // Maximum of six links in header per design brief
  navLinks: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Installation', href: '/instructions' },
    { label: 'Brahmi Story', href: '/story' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ],
  footerLinks: [
    { label: 'All Products', href: '/products' },
    { label: 'Installation Guide', href: '/instructions' },
    { label: 'Fonts & Resources', href: '/resources' },
    { label: 'FAQ & Help', href: '/faq' },
    { label: 'Brahmi Story', href: '/story' },
    { label: 'License Recovery', href: '/recover' },
    { label: 'Contact', href: '/contact' },
  ],
  contact: {
    proprietor: 'Naveen Jayachandra',
    city: 'Bengaluru',
    stateCountry: 'Karnataka, India',
    email: 'navbrahmi@gmail.com',
    phone: 'PLACEHOLDER: Pending client confirmation of public phone number (C-17)',
    gstinStatus: 'PLACEHOLDER: Registered GSTIN details pending confirmation (C-13)',
  },
  openDecisions: {
    taglineChoice: 'PLACEHOLDER: Awaiting client decision C-33 ("Indic Language Typing, Made Easy!" vs "Your Language, Your Typing, Made Easy")',
    neutralTextColor: '#231F20 (PROVISIONAL: from client logo, awaiting confirmation C-28)',
  },
};
