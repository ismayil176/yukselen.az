import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { createExam, deleteExam, listExams, updateExamInstructions, updateExamTitle, type CategoryKey } from "@/lib/exams";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!isAdminRequest()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as CategoryKey | null;
    const exams = await listExams(category ?? undefined);
    return NextResponse.json({ ok: true, exams });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminRequest()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => null)) as { category?: CategoryKey; title?: string } | null;
    const category = body?.category;
    const title = body?.title?.trim();
    if (!category || !title) return NextResponse.json({ ok: false, error: "category/title required" }, { status: 400 });
    const exam = await createExam({ category, title });
    return NextResponse.json({ ok: true, exam });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isAdminRequest()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => null)) as { examId?: string; instructions?: string; title?: string } | null;
    const examId = body?.examId;
    if (!examId) return NextResponse.json({ ok: false, error: "examId required" }, { status: 400 });

    // allow patching either instructions and/or title
    let updated: any = null;
    if (typeof body?.instructions === "string") {
      updated = await updateExamInstructions(examId, body.instructions);
    }
    if (typeof body?.title === "string") {
      updated = await updateExamTitle(examId, body.title);
    }

    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, exam: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isAdminRequest()) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = (await req.json().catch(() => null)) as { examId?: string } | null;
    const examId = body?.examId;
    if (!examId) return NextResponse.json({ ok: false, error: "examId required" }, { status: 400 });
    const ok = await deleteExam(examId);
    if (!ok) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
