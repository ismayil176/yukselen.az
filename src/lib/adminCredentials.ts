import "server-only";

import crypto from "node:crypto";
import { getJSON, setJSON } from "@/lib/railwayDb";

export type AdminCredentials = {
  username: string;
  passwordSalt: string;
  passwordHash: string;
  updatedAt: string; // ISO
};

const KEY = "admin_credentials_v1";

export function pbkdf2(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
}

export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  // KV might not be attached yet. In that case, we still want the app to boot
  // and allow env/default admin login.
  try {
    const fallback = null as AdminCredentials | null;
    const v = await getJSON<AdminCredentials | null>(KEY, fallback);
    if (!v) return null;
    if (!v.username || !v.passwordSalt || !v.passwordHash) return null;
    return v;
  } catch {
    return null;
  }
}

export async function setAdminCredentials(input: { username: string; password: string }) {
  const username = input.username.trim();
  if (!username) throw new Error("İstifadəçi adı boş ola bilməz");
  const password = input.password;
  if (!password || password.trim().length < 4) throw new Error("Şifrə çox qısadır");

  // 16 bytes hex salt (32 chars)
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = pbkdf2(password, salt);

  const value: AdminCredentials = {
    username,
    passwordSalt: salt,
    passwordHash: hash,
    updatedAt: new Date().toISOString(),
  };

  // If KV isn't configured, provide a clear message.
  try {
    await setJSON(KEY, value);
  } catch {
    throw new Error(
      "Database konfiqurasiya olunmayıb (DATABASE_URL). Railway-də Project → Add → PostgreSQL əlavə et və service variables-də DATABASE_URL olduğuna əmin ol."
    );
  }
  return { username, passwordSalt: salt, passwordHash: hash };
}
