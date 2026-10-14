import { Resend } from "resend";
import { prisma } from "@/lib/db/prisma";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// resend.dev's shared test domain works without verifying your own domain,
// but only delivers to the Resend account owner's own address — fine for
// trying this out, not for real multi-user delivery. Verify a domain in
// Resend and set RESEND_FROM_EMAIL to something on it for production.
const DEFAULT_FROM = "Orbit <onboarding@resend.dev>";

interface RunCompletedEmailArgs {
  accountId: string;
  status: "COMPLETED" | "FAILED";
  summary: string;
}

/**
 * Best-effort — a failure here must never fail the agent cycle itself.
 * Callers (lib/inngest/functions/agent-cycle.ts) call this after the
 * AgentRun row is already finalized, and swallow whatever this throws.
 */
export async function sendRunCompletedEmail(args: RunCompletedEmailArgs): Promise<void> {
  const resend = getClient();
  if (!resend) return; // Not configured — silently a no-op, same as other optional integrations (Unsplash, etc).

  const users = await prisma.user.findMany({
    where: { accountId: args.accountId },
    select: { email: true },
  });
  if (users.length === 0) return;

  const subject =
    args.status === "FAILED" ? "Orbit agent run failed" : "Orbit agent run completed";

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to: users.map((u) => u.email),
    subject,
    text: args.summary,
  });
}

interface NewSignupEmailArgs {
  email: string;
  accountName: string;
  accountType: string;
}

/**
 * Notifies you (the app owner), not the new user — ADMIN_NOTIFICATION_EMAIL
 * is a separate address from anything tied to an Account/User row. Silently
 * a no-op if either RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL is unset, same
 * pattern as sendRunCompletedEmail. Best-effort — callers (app/api/auth/
 * session/route.ts) must swallow whatever this throws rather than let a
 * failed notification break someone's actual signup.
 */
export async function sendNewSignupEmail(args: NewSignupEmailArgs): Promise<void> {
  const resend = getClient();
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !to) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || DEFAULT_FROM,
    to,
    subject: "New Orbit signup",
    text: `${args.email} just signed up — account "${args.accountName}" (${args.accountType}).`,
  });
}
