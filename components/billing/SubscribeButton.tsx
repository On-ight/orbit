"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { PlanTier } from "@/lib/billing/pricing";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function SubscribeButton({ planTier, accountName }: { planTier: PlanTier; accountName: string }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData?.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Orbit AI",
        description: `${planTier} plan`,
        prefill: { name: accountName },
        theme: { color: "#171717" },
        modal: {
          // User closed the modal without paying — not an error, just stop.
          ondismiss: () => setLoading(false),
        },
        handler: async (response: unknown) => {
          const payment = response as {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          };
          const verifyRes = await fetch("/api/billing/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const verifyData = await verifyRes.json();
          setLoading(false);
          if (!verifyRes.ok) {
            setError(verifyData?.error ?? "Payment could not be verified.");
            return;
          }
          router.push("/dashboard");
          router.refresh();
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed — you have not been charged.");
        setLoading(false);
      });

      razorpay.open();
    } catch {
      setError("Something went wrong starting checkout.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />
      <button
        onClick={handleClick}
        disabled={!scriptReady || loading}
        className="block w-full rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Opening checkout…" : "Subscribe"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
