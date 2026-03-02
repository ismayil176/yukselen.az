import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getVerbalPassage, upsertVerbalPassage } from "@/lib/questions";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { examId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const section = url.searchParams.get("section") as any;
  if (!section) return NextResponse.json({ error: "section lazımdır" }, { status: 400 });

  const p = await getVerbalPassage(ctx.params.examId, section);
  return NextResponse.json({ ok: true, passage: p });
}

export async function PUT(req: Request, ctx: { params: { examId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const section = body.section as any;
  const text = String(body.text ?? "");

  if (!section) return NextResponse.json({ error: "section lazımdır" }, { status: 400 });

  const saved = await upsertVerbalPassage(ctx.params.examId, section, text);
  return NextResponse.json({ ok: true, passage: saved });
}
