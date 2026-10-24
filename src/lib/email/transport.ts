import { logger } from '../logger';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTransport {
  sendMail(options: EmailOptions): Promise<EmailResult>;
}

/**
 * Development & preview transport.
 * Strictly guarantees that no secrets, full emails, or raw license keys are exposed in logs.
 */
export class DevEmailTransport implements EmailTransport {
  async sendMail(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, text } = options;

    logger.info('Development email preview dispatched to outbox', {
      to,
      subject,
      snippetLength: text.length,
    });

    return {
      success: true,
      messageId: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  }
}

/**
 * In-memory mock transport for unit and integration testing.
 */
export class MockEmailTransport implements EmailTransport {
  public sentMails: EmailOptions[] = [];
  public shouldFail: boolean = false;
  public failErrorMessage: string = 'Simulated SMTP connection timeout';

  async sendMail(options: EmailOptions): Promise<EmailResult> {
    if (this.shouldFail) {
      return {
        success: false,
        error: this.failErrorMessage,
      };
    }

    this.sentMails.push({ ...options });
    return {
      success: true,
      messageId: `mock-${Date.now()}-${this.sentMails.length}`,
    };
  }

  clear(): void {
    this.sentMails = [];
    this.shouldFail = false;
  }
}

/**
 * Resend Transactional Email Transport.
 * Communicates with https://api.resend.com/emails via native fetch.
 * Uses verified domain brahmicomputing.in per agreement and client mailbox configuration.
 */
export class ResendEmailTransport implements EmailTransport {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || '';
    this.fromEmail = fromEmail || process.env.RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'Nav Brahmi <support@brahmicomputing.in>';
  }

  async sendMail(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY environment variable is not configured.',
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Resend API returned HTTP ${response.status}`,
        };
      }

      logger.info('Email sent successfully via Resend', {
        to: options.to,
        messageId: data.id,
      });

      return {
        success: true,
        messageId: data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Network error connecting to Resend: ${err?.message || err}`,
      };
    }
  }
}

let primaryTransport: EmailTransport | null = null;

export function getEmailTransport(): EmailTransport {
  if (primaryTransport) {
    return primaryTransport;
  }

  const provider = (process.env.EMAIL_PROVIDER || 'dev').toLowerCase();
  if (provider === 'resend') {
    return new ResendEmailTransport();
  }
  if (provider === 'mock') {
    return new MockEmailTransport();
  }
  return new DevEmailTransport();
}

export function setEmailTransport(transport: EmailTransport | null): void {
  primaryTransport = transport;
}

