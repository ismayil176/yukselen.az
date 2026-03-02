export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { readDb, writeDb } from "@/lib/store";

function isObject(v: unknown): v is Record<string, any> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Accept either JSON body or multipart (file upload)
  let raw: any = null;
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const file = fd.get("file");
      if (!(file instanceof File)) throw new Error("Fayl tapılmadı");
      const txt = await file.text();
      raw = JSON.parse(txt);
    } else {
      raw = await req.json();
    }
  } catch {
    return NextResponse.json({ error: "Backup faylı oxunmadı (JSON)" }, { status: 400 });
  }

  // Payload can be either {db:{...}} or direct db.
  const dbCandidate = isObject(raw) && isObject(raw.db) ? raw.db : raw;
  if (!isObject(dbCandidate)) {
    return NextResponse.json({ error: "Backup formatı yanlışdır" }, { status: 400 });
  }

  const exams = Array.isArray((dbCandidate as any).exams) ? (dbCandidate as any).exams : null;
  const questions = Array.isArray((dbCandidate as any).questions) ? (dbCandidate as any).questions : null;
  const verbalPassages = Array.isArray((dbCandidate as any).verbalPassages) ? (dbCandidate as any).verbalPassages : null;

  if (!exams || !questions || !verbalPassages) {
    return NextResponse.json({ error: "Backup daxilində exams/questions/verbalPassages tapılmadı" }, { status: 400 });
  }

  // Replace DB (simple + predictable). Keep a small server-side snapshot for safety.
  const prev = await readDb();
  const next = {
    exams: exams as any,
    questions: questions as any,
    verbalPassages: verbalPassages as any,
  };

  try {
    await writeDb(next as any);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB yazılmadı" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    restored: { exams: exams.length, questions: questions.length, verbalPassages: verbalPassages.length },
    previous: { exams: prev.exams.length, questions: prev.questions.length, verbalPassages: prev.verbalPassages.length },
  });
}
