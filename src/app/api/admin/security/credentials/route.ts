import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { setAdminCredentials } from "@/lib/adminCredentials";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
  const username = (body?.username ?? "").trim();
  const password = body?.password ?? "";

  try {
    const saved = await setAdminCredentials({ username, password });
    // Do not leak password; return minimal info
    return NextResponse.json({ ok: true, username: saved.username, updated: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Xəta" }, { status: 400 });
  }
}
