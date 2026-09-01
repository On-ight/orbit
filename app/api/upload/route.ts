import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { withAuth } from "@/lib/auth/with-auth";
import { defaultCrudLimiter } from "@/lib/redis/rate-limit";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const POST = withAuth(async (request) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be 5MB or smaller" }, { status: 400 });
  }

  try {
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json({ error: `Upload failed: ${String(err)}` }, { status: 502 });
  }
}, { rateLimit: defaultCrudLimiter });
