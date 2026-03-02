import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { deleteMessage } from "@/lib/messagesStore";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ok = await deleteMessage(ctx.params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
