import "server-only";
import crypto from "node:crypto";
import { getJSON, hasDatabase, setJSON } from "@/lib/railwayDb";

export type StudentInfo = {
  firstName: string;
  lastName: string;
  fatherName: string;
  phone: string;
};

export type AttemptStatus = "IN_PROGRESS" | "FINISHED";

export type Attempt = {
  id: string;
  examId: string;
  category: string;
  student: StudentInfo;
  status: AttemptStatus;
  score: number;
  startedAt: string;
  finishedAt?: string;
  meta?: {
    totalQuestions?: number;
    correctCount?: number;
  };
};

type AttemptsDb = { attempts: Attempt[] };

const ATTEMPTS_KEY = "attempts.json";

async function safeRead(): Promise<AttemptsDb> {
  if (!hasDatabase()) return { attempts: [] };
  return await getJSON<AttemptsDb>(ATTEMPTS_KEY, { attempts: [] });
}

async function safeWrite(next: AttemptsDb): Promise<void> {
  if (!hasDatabase()) {
    throw new Error(
      "Database konfiqurasiya olunmayıb (DATABASE_URL). Railway-də Project → Add → PostgreSQL əlavə et və service variables-də DATABASE_URL olduğuna əmin ol."
    );
  }
  await setJSON(ATTEMPTS_KEY, next);
}


function mapRow(r: any): Attempt {
  return {
    id: String(r.id),
    examId: String(r.exam_id ?? r.examId),
    category: String(r.category ?? ""),
    student: (r.student ?? {}) as StudentInfo,
    status: (r.status ?? "IN_PROGRESS") as AttemptStatus,
    score: Number(r.score ?? 0),
    startedAt: new Date(r.started_at ?? r.startedAt ?? Date.now()).toISOString(),
    finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : undefined,
    meta: (r.meta ?? undefined) as any,
  };
}

export async function createAttempt(input: { examId: string; category: string; student: StudentInfo }) {
  // local fallback
  const db = await safeRead();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const attempt: Attempt = {
    id,
    examId: input.examId,
    category: input.category,
    student: input.student,
    status: "IN_PROGRESS",
    score: 0,
    startedAt: now,
  };
  db.attempts.unshift(attempt);
  await safeWrite(db);
  return attempt;
}

export async function finishAttempt(input: { id: string; score: number; totalQuestions?: number; correctCount?: number }) {
  const db = await safeRead();
  const idx = db.attempts.findIndex((a) => a.id === input.id);
  if (idx === -1) return null;
  const a = db.attempts[idx];
  const finishedAt = new Date().toISOString();
  const updated: Attempt = {
    ...a,
    status: "FINISHED",
    score: Number.isFinite(input.score) ? input.score : a.score,
    finishedAt,
    meta: {
      ...(a.meta ?? {}),
      totalQuestions: input.totalQuestions ?? a.meta?.totalQuestions,
      correctCount: input.correctCount ?? a.meta?.correctCount,
    },
  };
  db.attempts[idx] = updated;
  await safeWrite(db);
  return updated;
}

export async function listAttempts(take: number) {
  const n = Math.max(1, Math.min(1000, take));

  const db = await safeRead();
  return db.attempts.slice(0, n);
}
