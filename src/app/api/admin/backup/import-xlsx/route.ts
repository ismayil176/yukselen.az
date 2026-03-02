export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { readDb, writeDb, type Db, type Exam, type Question, type VerbalPassage } from "@/lib/store";
import { saveImage } from "@/lib/imageStore";
import ExcelJS from "exceljs";

function asStr(v: any) {
  if (v == null) return "";
  return String(v);
}

function asNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Fayl upload edin (multipart/form-data)" }, { status: 400 });
  }

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(bytes);
  } catch {
    return NextResponse.json({ error: "Excel faylı oxunmadı (.xlsx)" }, { status: 400 });
  }

  const wsExams = wb.getWorksheet("Exams");
  const wsQ = wb.getWorksheet("Questions");
  const wsPass = wb.getWorksheet("VerbalPassages");
  const wsImg = wb.getWorksheet("Images");

  if (!wsExams || !wsQ || !wsPass) {
    return NextResponse.json({ error: "Excel formatı yanlışdır (sheet-lər tapılmadı)" }, { status: 400 });
  }

  // Images: map oldKey -> newKey (because uploads generate new unique keys)
  const imageKeyMap = new Map<string, string>();
  if (wsImg) {

    // iterate starting from row 2 (skip header)
    for (let r = 2; r <= wsImg.rowCount; r++) {
      const row = wsImg.getRow(r);
      const oldKey = asStr(row.getCell(1).value).trim();
      const contentType = asStr(row.getCell(2).value).trim() || "application/octet-stream";
      const b64 = asStr(row.getCell(3).value).trim();
      if (!oldKey || !b64) continue;
      try {
        const ab = Buffer.from(b64, "base64");
        const saved = await saveImage({ bytes: ab.buffer.slice(ab.byteOffset, ab.byteOffset + ab.byteLength), contentType });
        imageKeyMap.set(oldKey, saved.imageKey);
      } catch {
        // skip broken image rows
      }
    }
  }

  const exams: Exam[] = [];
  for (let r = 2; r <= wsExams.rowCount; r++) {
    const row = wsExams.getRow(r);
    const id = asStr(row.getCell(1).value).trim();
    if (!id) continue;
    exams.push({
      id,
      category: asStr(row.getCell(2).value).trim() as any,
      title: asStr(row.getCell(3).value),
      instructions: asStr(row.getCell(4).value),
      passScore: asNum(row.getCell(5).value, 0),
      createdAt: asStr(row.getCell(6).value) || new Date().toISOString(),
      updatedAt: asStr(row.getCell(7).value) || new Date().toISOString(),
    });
  }

  const verbalPassages: VerbalPassage[] = [];
  for (let r = 2; r <= wsPass.rowCount; r++) {
    const row = wsPass.getRow(r);
    const id = asStr(row.getCell(1).value).trim();
    if (!id) continue;
    verbalPassages.push({
      id,
      examId: asStr(row.getCell(2).value).trim(),
      section: asStr(row.getCell(3).value).trim() as any,
      text: asStr(row.getCell(4).value),
    });
  }

  const questions: Question[] = [];
  for (let r = 2; r <= wsQ.rowCount; r++) {
    const row = wsQ.getRow(r);
    const id = asStr(row.getCell(1).value).trim();
    if (!id) continue;
    const oldKey = asStr(row.getCell(6).value).trim();
    const mappedKey = oldKey ? imageKeyMap.get(oldKey) ?? oldKey : null;

    questions.push({
      id,
      examId: asStr(row.getCell(2).value).trim(),
      section: asStr(row.getCell(3).value).trim() as any,
      text: asStr(row.getCell(4).value),
      score: Math.max(1, asNum(row.getCell(5).value, 1)),
      imageKey: mappedKey || null,
      // imageUrl will be re-derived by migrateDb at read time
      image: null,
      imageUrl: mappedKey ? `/api/images/${encodeURIComponent(mappedKey)}` : null,
      options: [
        asStr(row.getCell(7).value),
        asStr(row.getCell(8).value),
        asStr(row.getCell(9).value),
        asStr(row.getCell(10).value),
        asStr(row.getCell(11).value),
      ],
      correctIndex: asNum(row.getCell(12).value, 0),
    });
  }

  if (!exams.length || !questions.length) {
    return NextResponse.json({ error: "Excel daxilində exams/questions boşdur" }, { status: 400 });
  }

  const prev = await readDb();
  const next: Db = { exams, questions, verbalPassages };

  try {
    await writeDb(next);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "DB yazılmadı" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    restored: { exams: exams.length, questions: questions.length, verbalPassages: verbalPassages.length, images: imageKeyMap.size },
    previous: { exams: prev.exams.length, questions: prev.questions.length, verbalPassages: prev.verbalPassages.length },
  });
}
