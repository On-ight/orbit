import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { attachSessionCookie } from "@/lib/auth/issue-session";

// Must run on the Node runtime, not edge — hashPassword uses Node's built-in
// crypto.scrypt, which edge doesn't support.

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const accountName = typeof body?.accountName === "string" ? body.accountName.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }
  if (!accountName) {
    return NextResponse.json({ error: "A brand/company name is required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      account: {
        create: {
          name: accountName,
          // No plan yet — the dashboard redirects to /pricing until a Stripe
          // webhook flips this to "active".
          subscriptionStatus: "incomplete",
        },
      },
    },
  });

  const response = NextResponse.json({ ok: true });
  return attachSessionCookie(response, user);
}
