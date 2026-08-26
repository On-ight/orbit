import Razorpay from "razorpay";

// Constructed per call rather than a module-level singleton so a missing
// env var throws clearly inside the route handler that needs it, instead of
// at import time wherever this module happens to get pulled in.
export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id, key_secret });
}
