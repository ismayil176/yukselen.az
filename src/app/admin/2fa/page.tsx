"use client";

import { useState } from "react";

export default function Admin2FA() {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function safeJson(res: Response) {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return null;
    }
  }

  async function setup() {
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/admin/2fa/setup", { method: "POST" });
    const json = await safeJson(res);
    setLoading(false);

    if (!res.ok) {
      setMsg(json?.error || "Xəta");
      return;
    }
    setQr(json?.qrDataUrl ?? null);
    setSecret(json?.secretBase32 ?? null);
  }

  async function enable() {
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/admin/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otpCode: otp, secret }),
    });
    const json = await safeJson(res);
    setLoading(false);

    if (!res.ok) {
      setMsg(json?.error || "Xəta");
      return;
    }
    setMsg("✅ OTP təsdiqləndi. Railway → Service → Variables bölməsinə ADMIN_TOTP_SECRET və ADMIN_TOTP_ENABLED=true əlavə edib redeploy et.");
  }

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-bold mb-2">Admin 2FA (Google Authenticator)</h1>
          <p className="text-sm text-slate-700 mb-6">
            Setup → QR scan → OTP yaz → Enable.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={setup}
              disabled={loading}
              className="rounded-xl bg-white text-purple-950 px-4 py-2 font-semibold disabled:opacity-60"
            >
              Setup (QR yarat)
            </button>
          </div>

          {qr && (
            <div className="mt-6 grid gap-3">
              <img src={qr} alt="2FA QR" className="w-56 h-56 border rounded-xl" />
              {secret && (
                <div className="text-sm">
                  Secret (backup): <code className="break-all">{secret}</code>
                </div>
              )}

              <input
                className="border border-black/10 rounded-xl p-3 bg-white"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="OTP (6 rəqəm)"
                inputMode="numeric"
              />

              <button
                onClick={enable}
                disabled={loading || otp.trim().length !== 6}
                className="rounded-xl bg-white text-purple-950 px-4 py-2 font-semibold disabled:opacity-60"
              >
                Enable 2FA
              </button>
            </div>
          )}

          {msg && <div className="mt-4 text-sm">{msg}</div>}
        </div>
      </div>
    </main>
  );
}
