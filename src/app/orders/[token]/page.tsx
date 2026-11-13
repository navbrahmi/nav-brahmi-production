import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { decryptLicenseKey } from '@/lib/license-crypto';
import { createPurchaseAuthToken } from '@/lib/license';
import { OrderStatusClient } from './order-status-client';

export const metadata: Metadata = {
  title: 'Order Status | Nav Brahmi',
  description: 'View the status and delivery progress of your Nav Brahmi software order.',
};

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: {
      product: true,
      licenses: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  let licenseKey: string | undefined;
  let downloadUrl: string | undefined;

  if (order.licenses.length > 0) {
    const activeLicense = order.licenses[0];
    const decrypted = decryptLicenseKey(activeLicense) || activeLicense.licenseKey;
    if (decrypted) {
      licenseKey = decrypted;
      downloadUrl = '/api/download-installer';
    }
  }

  return (
    <div className="container section">
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}>Order Confirmation</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Detailed transaction status and software fulfillment details.
        </p>
      </div>

      <OrderStatusClient
        initialData={{
          publicToken: order.publicToken,
          initialStatus: order.status,
          productName: order.product.name,
          amountMinor: order.amountMinor,
          currency: order.currency,
          customerEmail: maskEmail(order.customerEmail),
          createdAt: order.createdAt.toISOString(),
          hasLicense: order.licenses.length > 0,
          licenseKey,
          downloadUrl,
        }}
      />
    </div>
  );
}
