import 'server-only';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  requestId?: string;
  [key: string]: any;
}

const REDACTION_PATTERNS = [
  // License keys (NAV-XXXX-XXXX-XXXX-XXXX)
  { regex: /NAV-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}/gi, replacement: '[REDACTED_LICENSE_KEY]' },
  // Bearer / Authorization headers
  { regex: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, replacement: 'Bearer [REDACTED_AUTH]' },
  // S3 / R2 presigned URLs
  { regex: /https:\/\/[^\s"'<>]+\?[^\s"'<>]*X-Amz-Signature=[^\s"'<>]+/gi, replacement: '[REDACTED_PRESIGNED_URL]' },
  // Generic Private Keys
  { regex: /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----[\s\S]+?-----END[ A-Z0-9_-]+PRIVATE KEY-----/gi, replacement: '[REDACTED_PRIVATE_KEY]' },
  // Download tokens, order tokens, JWTs, auth in query strings (?token=..., &orderToken=..., etc.)
  { regex: /([?&](?:token|download_token|auth|orderToken|order_token|order_ref|licenseKey|license_key)=)[^&\s"'<>]+/gi, replacement: '$1[REDACTED_TOKEN]' },
  // JWT / Ed25519 tokens in strings (header.payload.sig or payload.sig)
  { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{10,})?/g, replacement: '[REDACTED_TOKEN]' },
];

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data;
    for (const { regex, replacement } of REDACTION_PATTERNS) {
      sanitized = sanitized.replace(regex, replacement);
    }
    // Mask standalone email if detected
    if (/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(sanitized)) {
      sanitized = maskEmail(sanitized);
    }
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('secret') ||
        lowerKey.includes('password') ||
        lowerKey.includes('privatekey') ||
        lowerKey.includes('token') ||
        lowerKey.includes('signature') ||
        lowerKey.includes('auth')
      ) {
        sanitizedObj[key] = '[REDACTED]';
      } else if (lowerKey.includes('email') && typeof value === 'string') {
        sanitizedObj[key] = maskEmail(value);
      } else {
        sanitizedObj[key] = redactSensitiveData(value);
      }
    }
    return sanitizedObj;
  }

  return data;
}

export const logger = {
  log(level: LogLevel, message: string, context?: LogContext) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message: redactSensitiveData(message),
      ...(context ? redactSensitiveData(context) : {}),
    };

    const output = JSON.stringify(payload);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  },

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  },

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  },

  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  },

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  },
};
