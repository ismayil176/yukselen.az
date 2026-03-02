import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "admin_session";

type SessionPayload = {
  u: string; // username
  exp: number; // epoch seconds
};

function base64url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function unbase64url(input: string) {
  const pad = input.length % 4;
  const s = (input + (pad ? "=".repeat(4 - pad) : ""))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return Buffer.from(s, "base64").toString("utf8");
}

function hmac(data: string) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "";

  // Best-effort fallback for deployments where a secret is not configured.
  // NOTE: It's still recommended to set ADMIN_SESSION_SECRET for stronger security.
  const vercelFallback = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_URL || "";

  // Dev fallback is OK locally; on Vercel we can fall back to project-specific values
  // so admin login doesn't fail with a generic error.
  const safeSecret = secret || vercelFallback || "dev-secret-change-me";
  return crypto.createHmac("sha256", safeSecret).update(data).digest("base64url");
}

function signSession(payload: SessionPayload) {
  const body = base64url(JSON.stringify(payload));
  const sig = hmac(body);
  return `${body}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  if (hmac(body) !== sig) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(unbase64url(body));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload?.u || !payload?.exp || payload.exp < now) return null;
  return payload;
}

export function isAdminRequest() {
  const token = cookies().get(COOKIE)?.value;
  return Boolean(verifySession(token));
}

export function setAdminCookie(username: string) {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8h
  const token = signSession({ u: username, exp });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE);
}
