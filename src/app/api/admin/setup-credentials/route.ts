import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prismaForCredentialsAuth } from "@/lib/prisma-credentials";

function tokenMatches(expected: string, received: string): boolean {
  const eh = createHash("sha256").update(expected, "utf8").digest();
  const rh = createHash("sha256").update(received, "utf8").digest();
  return timingSafeEqual(eh, rh);
}

/**
 * One-time production bootstrap: set admin email + password when you cannot run `db:seed:admin`
 * against the live database. Set `ADMIN_SETUP_TOKEN` (long random) in Vercel, POST once, then
 * remove the env var. Route returns 404 when the token is unset so it is not discoverable.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SETUP_TOKEN?.trim();
  if (!secret) {
    return new NextResponse(null, { status: 404 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const presented = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!presented || !tokenMatches(secret, presented)) {
    return new NextResponse(null, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const b = body as { password?: string; email?: string };
  const password = typeof b.password === "string" ? b.password : "";
  if (password.length < 10) {
    return NextResponse.json({ ok: false, error: "password_too_short" }, { status: 400 });
  }

  const email = (
    typeof b.email === "string" && b.email.trim()
      ? b.email.trim()
      : process.env.ADMIN_EMAIL?.trim() || "jziegenhorn@teamexpansion.org"
  ).toLowerCase();

  const prisma = prismaForCredentialsAuth();
  const passwordHash = await hash(password, 10);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { email, passwordHash, role: "ADMIN" },
    });
  } else {
    await prisma.user.create({
      data: { email, name: "Admin", passwordHash, role: "ADMIN" },
    });
  }

  return NextResponse.json({ ok: true });
}
