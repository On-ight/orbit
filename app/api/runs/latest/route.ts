import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth } from "@/lib/auth/with-auth";
import { runsPollLimiter } from "@/lib/redis/rate-limit";

// Polled by components/dashboard/RunNotifier.tsx to show a real-time
// top-right toast when a run finishes — this just reads the most recent
// AgentRun, nothing pushes to the client (no websocket/SSE infra here),
// so "real-time" is actually short-interval polling from the browser.
export const GET = withAuth(async (_request, { user: currentUser }) => {
  const run = await prisma.agentRun.findFirst({
    where: { accountId: currentUser.accountId },
    orderBy: { startedAt: "desc" },
    select: { id: true, status: true, summary: true, completedAt: true },
  });

  if (!run) return NextResponse.json({ run: null });

  return NextResponse.json({
    run: {
      id: run.id,
      status: run.status,
      summary: run.summary,
      completedAt: run.completedAt?.toISOString() ?? null,
    },
  });
}, { rateLimit: runsPollLimiter });
