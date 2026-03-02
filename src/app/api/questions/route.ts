import { NextResponse } from "next/server";
import { listQuestions } from "@/lib/questions";
import type { SectionKey } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId") || "";
  const section = (searchParams.get("section") || "") as SectionKey | "";

  if (!examId) {
    return NextResponse.json({ error: "examId is required" }, { status: 400 });
  }

  const qs = await listQuestions(examId, section || undefined);
  return NextResponse.json({ questions: qs });
}
