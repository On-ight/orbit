import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { adminAuth } from "@/lib/firebase/admin";
import { attachSessionCookie } from "@/lib/auth/issue-session";

// Firebase Auth (client SDK) does the actual credential check — login/signup
// pages sign in/up directly against Firebase, then hand the resulting ID
// token here. This route only verifies that token server-side and maps the
// Firebase identity onto Orbit's own User/Account rows.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  const accountName = typeof body?.accountName === "string" ? body.accountName.trim() : "";

  if (!idToken) {
    return NextResponse.json({ error: "Missing sign-in token" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid or expired sign-in" }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

  if (!user) {
    // First time this Firebase identity has reached Orbit — the signup path.
    if (!accountName) {
      return NextResponse.json({ error: "No Orbit account for this login" }, { status: 404 });
    }
    user = await prisma.user.create({
      data: {
        email: decoded.email ?? "",
        firebaseUid: decoded.uid,
        account: {
          create: {
            name: accountName,
            // No plan yet — the dashboard redirects to /pricing until a
            // Stripe webhook flips this to "active".
            subscriptionStatus: "incomplete",
          },
        },
      },
    });
  }

  const response = NextResponse.json({ ok: true });
  return attachSessionCookie(response, idToken);
}
