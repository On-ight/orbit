import Razorpay from "razorpay";

// The SDK opens a fresh axios instance (its own HTTP agent) on every `new
// Razorpay()` — constructing one per call, as this used to do, piles up
// listeners on reused keep-alive sockets under repeated requests (Node's
// MaxListenersExceededWarning). Cached after first construction; env vars
// are still validated on every call so a missing one throws clearly, only
// the actual client construction is skipped after the first time.
let cachedClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  if (!cachedClient) {
    cachedClient = new Razorpay({ key_id, key_secret });
  }
  return cachedClient;
}
