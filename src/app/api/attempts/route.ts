import { NextResponse } from "next/server";
import { z } from "zod";
import { createAttempt } from "@/lib/attempts";

export const runtime = "nodejs";

const CreateSchema = z.object({
  examId: z.string().min(1),
  category: z.string().min(1),
  student: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    fatherName: z.string().min(1),
    phone: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Məlumatlar natamamdır" }, { status: 400 });
    }

    const attempt = await createAttempt(parsed.data);
    return NextResponse.json({ ok: true, attemptId: attempt.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Server xətası" }, { status: 500 });
  }
}
