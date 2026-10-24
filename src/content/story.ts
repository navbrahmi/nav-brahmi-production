/**
 * The Brahmi Story Content: "How Brahmi Became User-Friendly"
 * Agreement Reference: §02 p4 (PG-07)
 * Missing text is tracked as C-17 in docs/production/14-client-inputs-and-open-decisions.md
 */

export interface StorySection {
  title: string;
  paragraphs: string[];
}

export interface StoryContent {
  title: string;
  subtitle: string;
  introduction: string;
  sections: StorySection[];
  clientSubmissionPending: string;
}

export const storyContent: StoryContent = {
  title: 'How Brahmi Became User-Friendly',
  subtitle:
    'The story of revitalizing the ancient root of Indian scripts for the digital computing era.',
  introduction:
    'Brahmi is the monumental mother script of South and Southeast Asia, immortalized in Emperor Ashoka’s 3rd century BCE rock edicts. For centuries, typing classical Indic writing systems required specialized, cumbersome legacy software or transliteration hacks. Nav Brahmi was created to revolutionize this paradigm.',
  sections: [
    {
      title: 'The Epigraphic Heritage',
      paragraphs: [
        'India’s profound epigraphic and literary heritage is etched in stone, copper plates, and ancient palm-leaf manuscripts across thousands of historical sites. Deciphered in the early 19th century, Brahmi unlocked the direct words of ancient India.',
        'Yet in the modern digital age, access to these scripts remained confined to esoteric academic fonts and non-standard keyboard mappings that broke across different software applications.',
      ],
    },
    {
      title: 'Bridging Language and Modern Technology',
      paragraphs: [
        'The vision of Nav Brahmi was straightforward yet ambitious: create a single, intuitive keyboard methodology based on the scientific phonetic organization of Indian alphabets that could work seamlessly across modern computer systems.',
        'By integrating directly with standard Unicode specifications and native Microsoft Windows input architecture, typing in ancient and regional Indian languages became as effortless as typing in English.',
      ],
    },
  ],
  clientSubmissionPending:
    'PLACEHOLDER: Official client historical monograph and founder narrative text pending delivery (C-17)',
};
