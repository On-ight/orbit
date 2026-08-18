import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  const entry = await prisma.knowledgeBaseEntry.create({ data: { title, content } });
  return NextResponse.json(entry);
}
