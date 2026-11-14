import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidEmail } from '@/lib/license';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { getRazorpayConfig, createRazorpayOrder } from '@/lib/razorpay';
import { isPaymentBypassEnabled } from '@/lib/payment-bypass';
import { markOrderPaid } from '@/lib/payment-completion';
import { checkRateLimit } from '@/lib/rate-limiter';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limit Check
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = await checkRateLimit({
      key: 'checkout',
      ip,
      limit: 15,
      windowSeconds: 60,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many checkout requests. Please try again in a few moments.',
          },
        },
        { status: 429 }
      );
    }

    // 2. Parse and Validate Request Body
    let body: { productId?: string; customerName?: string; customerEmail?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const productId = body.productId?.trim();
    const customerName = body.customerName?.trim();
    const customerEmail = body.customerEmail?.trim().toLowerCase();

    if (!productId) {
      return NextResponse.json(
        { error: { code: 'MISSING_PRODUCT_ID', message: 'Product ID is required.' } },
        { status: 400 }
      );
    }

    if (!customerEmail || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: { code: 'INVALID_EMAIL', message: 'Please provide a valid email address.' } },
        { status: 400 }
      );
    }

    if (customerName && customerName.length > 100) {
      return NextResponse.json(
        { error: { code: 'NAME_TOO_LONG', message: 'Customer name cannot exceed 100 characters.' } },
        { status: 400 }
      );
    }

    // 3. Resolve Product & Enforce Confirmed Pricing
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }, { code: productId }],
        isActive: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: 'Requested product does not exist or is inactive.' } },
        { status: 404 }
      );
    }


    // Critical constraint: Never trust client price; reject products without confirmed database price
    if (product.priceMinor === null || product.priceMinor === undefined || product.priceMinor <= 0) {
      logger.warn('Checkout attempted for product with unconfirmed price', {
        productId: product.id,
        productSlug: product.slug,
      });

      return NextResponse.json(
        {
          error: {
            code: 'PRICE_PENDING_CONFIRMATION',
            message:
              'Product pricing is currently pending final client confirmation (C-02). Online purchase will be available upon pricing approval.',
          },
        },
        { status: 400 }
      );
    }

    const amountMinor = product.priceMinor;
    const currency = (product.currency || 'INR').toUpperCase();
    const publicToken = crypto.randomBytes(24).toString('base64url');

    // 4. Create Initial Database Order (CREATED status)
    const order = await prisma.order.create({
      data: {
        publicToken,
        productId: product.id,
        customerEmail,
        customerName: customerName || null,
        amountMinor,
        currency,
        status: OrderStatus.CREATED,
      },
    });

    await recordAuditEvent({
      type: 'ORDER_CREATED',
      actorType: 'CUSTOMER',
      refType: 'ORDER',
      refId: order.id,
      metadata: {
        amountMinor,
        currency,
        productId: product.id,
      },
    });

    // 4b. Local Development / Test Payment Bypass (Controlled Simulation Mode)
    if (isPaymentBypassEnabled()) {
      logger.info('Executing local test payment bypass', {
        orderId: order.id,
        orderToken: order.publicToken,
      });

      const testOrderId = `order_sim_${crypto.randomBytes(8).toString('hex')}`;
      const testPaymentId = `pay_sim_test_${crypto.randomBytes(12).toString('hex')}`;

      // Transition order to PAYMENT_PENDING and create initial payment record
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAYMENT_PENDING },
        }),
        prisma.payment.create({
          data: {
            orderId: order.id,
            provider: 'RAZORPAY',
            providerOrderId: testOrderId,
            providerPaymentId: testPaymentId,
            amountMinor,
            currency,
            status: PaymentStatus.CREATED,
            rawStatus: 'SIMULATED_TEST_PAYMENT_INITIATED',
          },
        }),
      ]);

      // Complete payment via existing markOrderPaid workflow
      await markOrderPaid({
        orderId: order.id,
        orderToken: order.publicToken,
        providerOrderId: testOrderId,
        providerPaymentId: testPaymentId,
        amountMinor,
        currency,
        rawStatus: 'SIMULATED_TEST_PAYMENT_CAPTURED',
        actorType: 'CUSTOMER',
      });

      // Send license delivery email if email transport is available
      try {
        const { processEmailOutbox } = await import('@/lib/email/outbox');
        await processEmailOutbox();
      } catch (emailErr: any) {
        logger.warn('Email dispatch notice for simulated purchase', { error: emailErr.message });
      }

      return NextResponse.json({
        success: true,
        isTestBypass: true,
        orderToken: order.publicToken,
        message: 'Simulated test payment successful. Order confirmed and license issued.',
      });
    }

    // 5. Razorpay Gateway Order Creation (TEST MODE)
    const razorpayConfig = getRazorpayConfig();

    if (!razorpayConfig) {
      logger.info('Order created, but Razorpay credentials are not yet configured in environment', {
        orderId: order.id,
      });

      return NextResponse.json({
        success: false,
        code: 'GATEWAY_CONFIG_PENDING',
        message:
          'Razorpay payment gateway activation is in progress. Once TEST credentials are configured, online payments will activate automatically.',
        orderToken: order.publicToken,
        product: {
          id: product.id,
          name: product.name,
          amountMinor,
          currency,
        },
      });
    }

    // Call Razorpay Orders API
    const rzpOrder = await createRazorpayOrder({
      amountMinor,
      currency,
      receipt: `rcpt_${order.publicToken.substring(0, 16)}`,
      notes: {
        orderId: order.id,
        orderToken: order.publicToken,
        productId: product.id,
        customerEmail,
      },
    });

    // Advance order to PAYMENT_PENDING & store provider order ID
    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAYMENT_PENDING },
      }),
      prisma.payment.create({
        data: {
          orderId: order.id,
          provider: 'RAZORPAY',
          providerOrderId: rzpOrder.id,
          amountMinor,
          currency,
          status: PaymentStatus.CREATED,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      orderToken: order.publicToken,
      razorpayOrderId: rzpOrder.id,
      keyId: razorpayConfig.keyId,
      amountMinor,
      currency,
      customerName: customerName || '',
      customerEmail,
      productName: product.name,
    });
  } catch (err: any) {
    logger.error('Unhandled error during checkout order initialization', { error: err.message });
    return NextResponse.json(
      {
        error: {
          code: 'CHECKOUT_INITIALIZATION_FAILED',
          message: 'An unexpected error occurred while initializing checkout. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
