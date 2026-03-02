import { NextResponse } from "next/server";
import { getVerbalPassage } from "@/lib/questions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId") || "";
  const section = searchParams.get("section") || "";

  if (!examId || !section) {
    return NextResponse.json({ error: "examId and section are required" }, { status: 400 });
  }

  const p = await getVerbalPassage(examId, section as any);
  return NextResponse.json({ passage: p?.text ?? null });
}
