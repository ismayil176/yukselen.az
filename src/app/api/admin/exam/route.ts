import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getExam } from "@/lib/exams";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  if (!examId) return NextResponse.json({ ok: false, error: "examId required" }, { status: 400 });

  const exam = await getExam(examId);
  if (!exam) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, exam });
}
