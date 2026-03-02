import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { authenticator } from "otplib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { otpCode?: string; secret?: string } | null;
  const otpCode = String(body?.otpCode ?? "").trim();
  const secret = String(body?.secret ?? "").trim();

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "Secret yoxdur. Əvvəl Setup et (QR yarat).",
      },
      { status: 400 }
    );
  }

  const ok = authenticator.check(otpCode, secret);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "OTP səhvdir" }, { status: 401 });
  }

  // Note: enabling is done by setting env vars on Railway.
  return NextResponse.json({
    ok: true,
    message:
      "OTP təsdiqləndi. İndi Railway → Service → Variables bölməsində ADMIN_TOTP_SECRET və ADMIN_TOTP_ENABLED=true təyin edib redeploy et.",
  });
}
