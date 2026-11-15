import { Metadata } from 'next';
import Link from 'next/link';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { decryptLicenseKey } from '@/lib/license-crypto';
import { RecoveryPortalClient, PortalLicenseItem } from './portal-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer License Recovery Portal | Nav Brahmi',
  description: 'Access your purchased Nav Brahmi software licenses, license keys, and installer downloads.',
};

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export default async function RecoveryPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || token.trim().length < 32) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '4rem 1rem' }}>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
          <h1 style={{ fontSize: '1.4rem', color: '#B91C1C', marginBottom: '0.75rem' }}>
            Invalid Recovery Link
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            This recovery link is missing or malformed. For your security, recovery links must be accessed directly from your email.
          </p>
          <Link href="/recover" className="btn btn-primary">
            Request New Recovery Link
          </Link>
        </div>
      </div>
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const recoveryRecord = await prisma.recoveryToken.findUnique({
    where: { tokenHash },
  });

  const now = new Date();

  // Validate single-use status
  if (!recoveryRecord) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '4rem 1rem' }}>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
          <h1 style={{ fontSize: '1.4rem', color: '#B91C1C', marginBottom: '0.75rem' }}>
            Recovery Link Not Found
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            This recovery link was not recognized. Please submit your purchase email to receive an active link.
          </p>
          <Link href="/recover" className="btn btn-primary">
            Request New Recovery Link
          </Link>
        </div>
      </div>
    );
  }

  if (recoveryRecord.usedAt) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '4rem 1rem' }}>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
          <h1 style={{ fontSize: '1.4rem', color: '#B91C1C', marginBottom: '0.75rem' }}>
            Recovery Link Already Used
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            In accordance with client security policy, each license recovery link is <strong>strictly single-use</strong>. If you need to access your licenses again, please request a fresh link.
          </p>
          <Link href="/recover" className="btn btn-primary">
            Request Fresh Recovery Link
          </Link>
        </div>
      </div>
    );
  }

  if (recoveryRecord.expiresAt < now) {
    return (
      <div className="container" style={{ maxWidth: '640px', padding: '4rem 1rem' }}>
        <div className="card card-elevated" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '16px' }}>
          <h1 style={{ fontSize: '1.4rem', color: '#B91C1C', marginBottom: '0.75rem' }}>
            Recovery Link Expired
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', lineHeight: '1.6' }}>
            This recovery link has expired (30-minute validity limit). Please request a new recovery link below.
          </p>
          <Link href="/recover" className="btn btn-primary">
            Request New Recovery Link
          </Link>
        </div>
      </div>
    );
  }

  // Atomically mark token as used immediately (strictly single use)
  await prisma.recoveryToken.update({
    where: { id: recoveryRecord.id },
    data: { usedAt: now },
  });

  // Fetch all active licenses for this email
  const licenses = await prisma.license.findMany({
    where: {
      email: { equals: recoveryRecord.email, mode: 'insensitive' },
      status: 'ACTIVE',
    },
    include: {
      product: true,
      order: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const portalLicenses: PortalLicenseItem[] = licenses.map((lic) => {
    const decrypted = decryptLicenseKey(lic) || lic.licenseKey || '[Protected Key - Contact Support]';
    return {
      id: lic.id,
      productName: lic.product.name,
      licenseKey: decrypted,
      orderToken: lic.order?.publicToken,
      createdAt: lic.createdAt.toISOString(),
    };
  });

  return (
    <div className="container section">
      <RecoveryPortalClient
        customerEmail={maskEmail(recoveryRecord.email)}
        licenses={portalLicenses}
      />
    </div>
  );
}

