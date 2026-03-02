import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listAttempts } from "@/lib/attempts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!isAdminRequest()) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const take = Math.min(1000, Math.max(1, Number(url.searchParams.get("take") ?? "100")));

    const attempts = await listAttempts(take);
    return NextResponse.json({ ok: true, attempts });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server xətası" }, { status: 500 });
  }
}
