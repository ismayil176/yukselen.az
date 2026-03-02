import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { deleteQuestion, updateQuestion } from "@/lib/questions";
import { readDb } from "@/lib/store";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: { examId: string; questionId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const patch: any = {};
  if (typeof body.text === "string") patch.text = body.text.trim();
  if (Array.isArray(body.options) && body.options.length === 5) patch.options = body.options;
  if (body.correctIndex !== undefined) patch.correctIndex = Number(body.correctIndex);
  if (body.score !== undefined) patch.score = Number(body.score);
  if (body.imageKey !== undefined) patch.imageKey = body.imageKey;
  if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl;
  // legacy support (older data URL uploads)
  if (body.image !== undefined) patch.image = body.image;
  if (typeof body.section === "string") patch.section = body.section;

  const updated = await updateQuestion(ctx.params.questionId, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // safety: keep examId unchanged
  if (updated.examId !== ctx.params.examId) {
    // do nothing; the store keeps original examId
  }

  return NextResponse.json({ ok: true, question: updated });
}

export async function DELETE(_req: Request, ctx: { params: { examId: string; questionId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // best-effort: cleanup attached image
  try {
    const db = await readDb();
    const q = db.questions.find((x) => x.id === ctx.params.questionId);
    const key = (q as any)?.imageKey as string | undefined;
    if (key) {
      // Dynamic import avoids hard type-check failures if the build sees a stale module shape.
      const mod: any = await import("@/lib/imageStore");
      if (typeof mod.deleteImage === "function") {
        await mod.deleteImage(key);
      }
    }
  } catch {
    // ignore cleanup errors
  }

  const ok = await deleteQuestion(ctx.params.questionId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
