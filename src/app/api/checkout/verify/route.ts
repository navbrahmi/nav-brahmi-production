import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCheckoutPaymentSignature } from '@/lib/razorpay';
import { markOrderPaid } from '@/lib/payment-completion';
import { checkRateLimit } from '@/lib/rate-limiter';
import { recordAuditEvent } from '@/lib/audit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rateLimit = await checkRateLimit({
      key: 'verify_checkout',
      ip,
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many verification attempts.' } },
        { status: 429 }
      );
    }

    // 2. Parse Body
    let body: {
      orderToken?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const {
      orderToken,
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: rzpSignature,
    } = body;

    if (!orderToken || !rzpOrderId || !rzpPaymentId || !rzpSignature) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_VERIFICATION_FIELDS',
            message: 'All verification parameters are required (orderToken, razorpay_order_id, razorpay_payment_id, razorpay_signature).',
          },
        },
        { status: 400 }
      );
    }

    // 3. Timing-Safe Server-Side Signature Verification
    const isValidSignature = verifyCheckoutPaymentSignature({
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId,
      razorpaySignature: rzpSignature,
    });

    if (!isValidSignature) {
      logger.warn('Checkout signature verification failed', {
        orderToken,
        rzpOrderId,
        rzpPaymentId,
      });

      await recordAuditEvent({
        type: 'CHECKOUT_SIGNATURE_FAILED',
        actorType: 'ANONYMOUS',
        refType: 'PAYMENT',
        refId: rzpPaymentId,
        metadata: { rzpOrderId, orderToken },
      });

      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Payment signature could not be verified by the server.',
          },
        },
        { status: 400 }
      );
    }

    // 4. Resolve Order from Database
    const order = await prisma.order.findUnique({
      where: { publicToken: orderToken },
    });

    if (!order) {
      return NextResponse.json(
        { error: { code: 'ORDER_NOT_FOUND', message: 'Order reference could not be found.' } },
        { status: 404 }
      );
    }

    // 5. Invoke Transactional, Idempotent Payment Completion
    const completionResult = await markOrderPaid({
      orderId: order.id,
      orderToken: order.publicToken,
      providerOrderId: rzpOrderId,
      providerPaymentId: rzpPaymentId,
      amountMinor: order.amountMinor,
      currency: order.currency,
      rawStatus: 'captured',
      actorType: 'CUSTOMER',
    });

    if (!completionResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'PAYMENT_COMPLETION_FAILED',
            message: completionResult.reason || 'Payment completion verification failed.',
          },
          orderStatus: completionResult.orderStatus,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderToken: order.publicToken,
      orderStatus: completionResult.orderStatus,
      isDuplicate: completionResult.isDuplicate,
    });
  } catch (err: any) {
    logger.error('Unhandled error in checkout verification endpoint', { error: err.message });
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'An error occurred during payment verification.',
        },
      },
      { status: 500 }
    );
  }
}
