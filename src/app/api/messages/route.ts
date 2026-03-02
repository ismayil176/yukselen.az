import { NextResponse } from "next/server";
import { z } from "zod";
import { createMessage } from "@/lib/messagesStore";

export const runtime = "nodejs";

const Schema = z.object({
  name: z.string().trim().min(2, "Ad yaz"),
  phone: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().min(3, "Mesaj yaz").max(2000),
  page: z.string().trim().max(300).optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues?.[0]?.message ?? "Xəta" }, { status: 400 });
  }

  try {
    const msg = await createMessage({
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      message: parsed.data.message,
      page: parsed.data.page ?? null,
    });
    return NextResponse.json({ ok: true, message: msg });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Mesaj saxlanmadı" },
      { status: 500 }
    );
  }
}
