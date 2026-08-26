import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getRazorpayClient } from "@/lib/billing/razorpay";
import { PLAN_PRICING, isPlanTier } from "@/lib/billing/pricing";

const MIN_AMOUNT_MINOR_UNITS = 100;

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const planTier = body?.planTier;
  if (!isPlanTier(planTier)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { amountMinorUnits: amount, currency } = PLAN_PRICING[planTier];
  if (amount < MIN_AMOUNT_MINOR_UNITS) {
    return NextResponse.json({ error: "Amount is below Razorpay's minimum" }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `ord_${Date.now()}`,
      // The plan being paid for lives here, not in the client's verify
      // request — verify-payment re-fetches the order from Razorpay to read
      // it back, so a tampered client request can't grant a higher tier.
      notes: { accountId: currentUser.accountId, planTier },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    return NextResponse.json({ error: `Razorpay order creation failed: ${String(err)}` }, { status: 500 });
  }
}
