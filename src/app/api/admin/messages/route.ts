import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { listMessages } from "@/lib/messagesStore";

export const runtime = "nodejs";

export async function GET() {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const msgs = await listMessages(500);
  return NextResponse.json({ ok: true, messages: msgs });
}
