import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { billingLimiter } from "@/lib/redis/rate-limit";
import { TRIAL_DURATION_MS } from "@/lib/billing/trial";

// Razorpay's own minimum order amount (100 minor units) means a $0 Free plan
// can never go through create-order/verify-payment — this activates it
// directly instead, no payment involved.
export const POST = withAuth(
  async (_request, { user: currentUser }) => {
    // trialEndsAt is set once and never cleared (see schema comment) — its
    // presence alone means this account already had its one free trial,
    // whether or not it has expired yet.
    if (currentUser.account.trialEndsAt !== null) {
      return NextResponse.json(
        { error: "You've already used your free trial — pick a paid plan to continue." },
        { status: 400 },
      );
    }

    await prisma.account.update({
      where: { id: currentUser.accountId },
      data: {
        subscriptionStatus: "active",
        planTier: "FREE",
        trialEndsAt: new Date(Date.now() + TRIAL_DURATION_MS),
      },
    });
    return NextResponse.json({ success: true });
  },
  { rateLimit: billingLimiter },
);
