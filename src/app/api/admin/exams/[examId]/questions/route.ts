import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { createQuestion, listQuestions } from "@/lib/questions";
import type { SectionKey } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: { examId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const section = url.searchParams.get("section") as SectionKey | null;

  const qs = await listQuestions(ctx.params.examId, section ?? undefined);
  return NextResponse.json({ ok: true, questions: qs });
}

export async function POST(req: Request, ctx: { params: { examId: string } }) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  const section = body.section as SectionKey;
  const text = String(body.text ?? "").trim();
  const options = body.options as string[];
  const correctIndex = Number(body.correctIndex);
  const score = Number(body.score ?? 1);
  const imageKey = (body.imageKey ?? null) as string | null;
  const imageUrl = (body.imageUrl ?? null) as string | null;
  const legacyImage = (body.image ?? null) as string | null;

  if (!section) return NextResponse.json({ error: "section lazımdır" }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Sual mətni boş ola bilməz" }, { status: 400 });
  if (!Array.isArray(options) || options.length !== 5 || options.some((x) => !String(x ?? "").trim())) {
    return NextResponse.json({ error: "5 cavab variantı lazımdır" }, { status: 400 });
  }
  if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex > 4) {
    return NextResponse.json({ error: "correctIndex 0-4 olmalıdır" }, { status: 400 });
  }
  if (!Number.isFinite(score) || score <= 0) {
    return NextResponse.json({ error: "score 0-dan böyük olmalıdır" }, { status: 400 });
  }

  const q = await createQuestion({
    examId: ctx.params.examId,
    section,
    text,
    score,
    imageKey,
    imageUrl: imageUrl ?? (imageKey ? `/api/images/${encodeURIComponent(imageKey)}` : null) ?? legacyImage,
    image: legacyImage,
    options: [options[0], options[1], options[2], options[3], options[4]],
    correctIndex,
  });

  return NextResponse.json({ ok: true, question: q });
}
