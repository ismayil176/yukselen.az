import { NextResponse } from "next/server";
import { z } from "zod";
import { finishAttempt } from "@/lib/attempts";

export const runtime = "nodejs";

const FinishSchema = z.object({
  attemptId: z.string().min(1),
  score: z.number(),
  totalQuestions: z.number().optional(),
  correctCount: z.number().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = FinishSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
    }

    const updated = await finishAttempt({
      id: parsed.data.attemptId,
      score: parsed.data.score,
      totalQuestions: parsed.data.totalQuestions,
      correctCount: parsed.data.correctCount,
    });

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Attempt tapılmadı" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server xətası" }, { status: 500 });
  }
}
