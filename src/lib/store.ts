import "server-only";

import { getJSON, hasDatabase, setJSON } from "@/lib/railwayDb";
import fs from "node:fs/promises";
import path from "node:path";

export type CategoryKey = "general" | "analytic" | "detail";

export type Exam = {
  id: string;
  category: CategoryKey;
  title: string;
  instructions: string;
  passScore: number;
  createdAt: string;
  updatedAt: string;
};

export type SectionKey =
  | "BLOK_1"
  | "BLOK_2"
  | "BLOK_3"
  | "BLOK_4"
  | "VERBAL_1"
  | "VERBAL_2"
  | "VERBAL_3"
  | "VERBAL_4"
  | "VERBAL_5"
  | "ABSTRACT"
  | "NUMERIC";

export type Question = {
  id: string;
  examId: string;
  section: SectionKey;
  text: string;
  /** hər sual üçün bal (default: 1) */
  score: number;
  /** şəkil blob açarı (tövsiyə olunan yeni format). optional */
  imageKey?: string | null;
  /** şəkil (data URL və ya URL). optional */
  image?: string | null;
  /** UI-də istifadə olunan alias (legacy üçün saxlanır). optional */
  imageUrl?: string | null;
  options: [string, string, string, string, string];
  correctIndex: number; // 0-4
};

export type VerbalPassage = {
  id: string;
  examId: string;
  section: "VERBAL_1" | "VERBAL_2" | "VERBAL_3" | "VERBAL_4" | "VERBAL_5";
  text: string;
};

export type Db = {
  exams: Exam[];
  questions: Question[];
  verbalPassages: VerbalPassage[];
};


const BLOBS_KEY = "db.json";

function migrateDb(parsed: Partial<Db>): Db {
  // very small "migration" so older db.json keeps working
  const exams = (parsed.exams ?? []) as Exam[];
  const questions = ((parsed.questions ?? []) as any[]).map((q) => {
    const score = Number(q.score);
    const imageKey = (q.imageKey ?? q.image_key ?? null) as string | null;
    const legacyImage = q.image ?? q.imageUrl ?? q.image_url ?? null;
    const computedUrl = imageKey ? `/api/images/${encodeURIComponent(imageKey)}` : null;
    return {
      ...q,
      score: Number.isFinite(score) && score > 0 ? score : 1,
      imageKey,
      // həm `image`, həm də `imageUrl` formatını dəstəklə
      image: legacyImage,
      // imageKey varsa həmişə bizim proxied url-i seç (PRIVATE blob üçün də işləyir)
      imageUrl: computedUrl ?? q.imageUrl ?? q.image_url ?? legacyImage ?? null,
    } as Question;
  });
  const verbalPassages = (parsed.verbalPassages ?? []) as VerbalPassage[];
  return { exams, questions, verbalPassages };
}

export async function readDb(): Promise<Db> {
  // If KV isn't configured yet, fall back to the bundled read-only db.json.
  // This avoids crashing Server Components in production builds.
  if (!hasDatabase()) {
    try {
      const p = path.join(process.cwd(), "data", "db.json");
      const txt = await fs.readFile(p, "utf8");
      const parsed = JSON.parse(txt) as Partial<Db>;
      return migrateDb(parsed);
    } catch {
      return migrateDb({ exams: [], questions: [], verbalPassages: [] });
    }
  }

  const parsed = await getJSON<Partial<Db>>(BLOBS_KEY, { exams: [], questions: [], verbalPassages: [] });
  return migrateDb(parsed);
}

export async function writeDb(db: Db) {
  if (!hasDatabase()) {
    throw new Error(
      "Database konfiqurasiya olunmayıb (DATABASE_URL). Railway-də Project → Add → PostgreSQL əlavə et, sonra service variables-də DATABASE_URL olduğuna əmin ol və redeploy et."
    );
  }
  await setJSON(BLOBS_KEY, db);
}
