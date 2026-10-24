/**
 * Download & Installation Instructions Content
 * Source: Client manuals and technical verification from Phase 1 audit
 * References: docs/production/07 §11, docs/production/13 §5
 */

export interface InstructionStep {
  stepNumber: number;
  title: string;
  instruction: string;
  notes?: string;
}

export interface InstructionsContent {
  title: string;
  subtitle: string;
  systemRequirements: {
    os: string;
    privileges: string;
    architecture: string;
    framework: string;
  };
  steps: InstructionStep[];
  keyboardShortcut: {
    shortcut: string;
    explanation: string;
  };
  troubleshooting: {
    issue: string;
    resolution: string;
  }[];
  clientNotesPending: string;
}

export const instructionsContent: InstructionsContent = {
  title: 'Download & Installation Instructions',
  subtitle:
    'Step-by-step guidance for installing and enabling your Nav Brahmi keyboard layout driver on Microsoft Windows.',
  systemRequirements: {
    os: 'Microsoft Windows 10 or Windows 11',
    privileges: 'Administrator permissions required to install MSKLC keyboard layout drivers',
    architecture: 'x64 (AMD64) or x86 (32-bit). ia64 delivered; ARM64 not supported in current packages (C-06)',
    framework: 'Native Windows Input Method subsystem (no external typing utilities required)',
  },
  steps: [
    {
      stepNumber: 1,
      title: 'Obtain Authorized Package & License',
      instruction:
        'Upon completing your license purchase, you receive an authorized download package containing the native Windows installer and digital user manual.',
      notes: 'Ensure your license key is accessible for software activation during initial setup.',
    },
    {
      stepNumber: 2,
      title: 'Run the Setup Bootstrapper',
      instruction:
        'Extract the downloaded ZIP package and launch the Nav Brahmi Setup executable with administrative rights.',
      notes: 'Windows User Account Control (UAC) will prompt for permission to register the layout DLL in system directories.',
    },
    {
      stepNumber: 3,
      title: 'Complete Windows MSI Installation',
      instruction:
        'Follow the on-screen installer prompts. The installer copies the keyboard layout DLL and registers the input method with the Windows Language Bar.',
      notes: 'A Windows user sign-out or restart may be required for newly registered layouts to appear in the active system tray.',
    },
    {
      stepNumber: 4,
      title: 'Switch to Your Nav Brahmi Keyboard',
      instruction:
        'In any text-capable Windows application, switch between your default keyboard and the Nav Brahmi layout using the Windows Key + Spacebar shortcut.',
      notes: 'The language indicator in your taskbar will reflect the active script.',
    },
  ],
  keyboardShortcut: {
    shortcut: 'Windows Key + Spacebar',
    explanation:
      'Standard Microsoft Windows keyboard input method toggle shortcut, verified across all Nav Brahmi driver packages and sticker materials.',
  },
  troubleshooting: [
    {
      issue: 'The layout does not appear immediately in the Windows Language Bar after installation.',
      resolution:
        'Sign out of your Windows user session and sign back in, or restart your computer. Windows reloads input layout DLLs upon user session initialization.',
    },
    {
      issue: 'Missing glyph boxes (tofu) appear when typing ancient or classical scripts.',
      resolution:
        'Install the corresponding Unicode font family included with your package. Ensure your word processor (e.g. Word, LibreOffice, or browser) is configured to use the Unicode font.',
    },
  ],
  clientNotesPending:
    'PLACEHOLDER: Pending client confirmation of final installer step-by-step screenshots and video walkthrough (C-17, C-06)',
};
