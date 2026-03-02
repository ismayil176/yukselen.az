import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/adminAuth";
import { authenticator } from "otplib";
import { getAdminCredentials, pbkdf2 } from "@/lib/adminCredentials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { username?: string; password?: string; otp?: string } | null;
  const username = (body?.username ?? "").trim();
  const pass = body?.password ?? "";
  const otp = (body?.otp ?? "").trim();

  // 1) Prefer credentials stored in KV (so you can change them from the site UI)
  const stored = await getAdminCredentials();

  const expectedUser = stored?.username ?? process.env.ADMIN_USERNAME ?? "admin";

  // Prefer hashed password if provided (more secure for env vars)
  const expectedHash = stored?.passwordHash ?? process.env.ADMIN_PASSWORD_HASH ?? "";
  const expectedSalt = stored?.passwordSalt ?? process.env.ADMIN_PASSWORD_SALT ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "admin";

  // Safety: never allow default credentials in production.
  const usingDefaultCreds = !stored && !process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD && !process.env.ADMIN_USERNAME;
  if (process.env.NODE_ENV === "production" && usingDefaultCreds) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Production-da admin üçün default (admin/admin) istifadə etmək olmaz. Railway → Service → Variables bölməsində ADMIN_USERNAME + ADMIN_PASSWORD (və ya ADMIN_PASSWORD_HASH/ADMIN_PASSWORD_SALT) təyin et, yaxud əvvəlcə lokalda /admin/security səhifəsində login olub cred-ləri saxla.",
      },
      { status: 500 }
    );
  }

  const totpSecret = process.env.ADMIN_TOTP_SECRET ?? "";
  const totpEnabled = (process.env.ADMIN_TOTP_ENABLED ?? "").toLowerCase() === "true";

  const passOk = expectedHash && expectedSalt ? pbkdf2(pass, expectedSalt) === expectedHash : pass === expectedPass;

  if (username !== expectedUser || !passOk) {
    return NextResponse.json({ ok: false, error: "İstifadəçi adı və ya şifrə yanlışdır" }, { status: 401 });
  }

  // 2FA (TOTP) – enable by setting ADMIN_TOTP_SECRET + ADMIN_TOTP_ENABLED=true
  if (totpEnabled && totpSecret) {
    const ok = authenticator.check(otp, totpSecret);
    if (!ok) return NextResponse.json({ ok: false, error: "2FA kod yanlışdır" }, { status: 401 });
  }

  setAdminCookie(username);
  return NextResponse.json({ ok: true });
}
