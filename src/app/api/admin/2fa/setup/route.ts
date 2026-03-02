import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function POST() {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // We generate a secret + QR, and the admin copies it into Railway service variables.
  const secret = authenticator.generateSecret();
  const issuer = process.env.ADMIN_TOTP_ISSUER ?? "Yukselis Exam";
  const label = process.env.ADMIN_TOTP_LABEL ?? (process.env.ADMIN_USERNAME ?? "admin");
  const otpauth = authenticator.keyuri(label, issuer, secret);

  const qrDataUrl = await QRCode.toDataURL(otpauth, { margin: 1, width: 256 });

  return NextResponse.json({
    ok: true,
    secretBase32: secret,
    otpauth,
    qrDataUrl,
    env: {
      ADMIN_TOTP_SECRET: secret,
      ADMIN_TOTP_ENABLED: "true",
    },
  });
}
