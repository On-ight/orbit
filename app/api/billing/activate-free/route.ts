import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { billingLimiter } from "@/lib/redis/rate-limit";

// Razorpay's own minimum order amount (100 minor units) means a $0 Free plan
// can never go through create-order/verify-payment — this activates it
// directly instead, no payment involved.
export const POST = withAuth(
  async (_request, { user: currentUser }) => {
    await prisma.account.update({
      where: { id: currentUser.accountId },
      data: { subscriptionStatus: "active", planTier: "FREE" },
    });
    return NextResponse.json({ success: true });
  },
  { rateLimit: billingLimiter },
);
