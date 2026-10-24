import { describe, it } from 'node:test';
import assert from 'node:assert';
import { POST } from '../../src/app/api/contact/route';
import { NextRequest } from 'next/server';

function createRequest(body: any, ip: string = '127.0.0.1') {
  return new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

describe('Contact Form API Route', () => {
  it('should accept valid contact submission and return success', async () => {
    const req = createRequest(
      {
        name: 'Epigraphy Scholar',
        email: 'scholar@example.ac.in',
        subject: 'Brahmi Keyboard Layout Inquiry',
        message: 'Requesting details regarding academic deployment on Windows workstations.',
      },
      `10.0.0.${Math.floor(Math.random() * 200) + 10}`
    );

    const res = await POST(req);
    assert.strictEqual(res.status, 200);

    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.message.includes('received'));
  });

  it('should reject invalid email or short message with status 400', async () => {
    const req = createRequest(
      {
        name: 'A',
        email: 'not-an-email',
        subject: '',
        message: 'short',
      },
      `10.0.0.${Math.floor(Math.random() * 200) + 10}`
    );

    const res = await POST(req);
    assert.strictEqual(res.status, 400);

    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error);
  });
});
