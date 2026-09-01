import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { billingLimiter } from "@/lib/redis/rate-limit";
import { getRazorpayClient } from "@/lib/billing/razorpay";

function signatureMatches(orderId: string, paymentId: string, signature: string, keySecret: string): boolean {
  const expectedHex = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const POST = withAuth(async (request, { user: currentUser }) => {
  const body = await request.json().catch(() => null);
  const razorpay_order_id = body?.razorpay_order_id;
  const razorpay_payment_id = body?.razorpay_payment_id;
  const razorpay_signature = body?.razorpay_signature;

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });
  }

  if (!signatureMatches(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 400 });
  }

  // Signature valid means this payment/order pair is genuinely from
  // Razorpay — it does not by itself say which plan to activate. Read that
  // back from the order's own notes (set server-side at creation, not
  // supplied by this request) so a modified client can't claim a plan it
  // didn't pay for.
  let order;
  try {
    order = await getRazorpayClient().orders.fetch(razorpay_order_id);
  } catch (err) {
    return NextResponse.json({ error: `Could not verify order: ${String(err)}` }, { status: 500 });
  }

  const notes = order.notes as Record<string, string> | undefined;
  if (!notes?.accountId || notes.accountId !== currentUser.accountId) {
    return NextResponse.json({ error: "This order does not belong to your account" }, { status: 400 });
  }
  if (!notes.planTier) {
    return NextResponse.json({ error: "Order is missing plan information" }, { status: 400 });
  }

  await prisma.account.update({
    where: { id: currentUser.accountId },
    data: {
      subscriptionStatus: "active",
      planTier: notes.planTier,
      // order.currency comes back from Razorpay's own record, not the
      // client — same trust boundary as notes.planTier above.
      billingCurrency: order.currency,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    },
  });

  return NextResponse.json({ success: true });
}, { rateLimit: billingLimiter });
