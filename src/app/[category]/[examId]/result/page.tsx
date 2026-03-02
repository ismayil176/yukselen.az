"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/Container";


const backMap: Record<string, string> = {
  general: "umumi-bilikler",
  analytic: "analitik-tehlil",
  detail: "idareetme-bacariqlari",
};

type BlockResult = {
  blockId: string;
  title: string;
  total: number;
  correct: number;
  totalPoints?: number;
  earnedPoints?: number;
  percent: number;
};

export default function ResultPage({ params }: { params: { category: string; examId: string } }) {
  const { category, examId } = params;
  const back = backMap[category] ?? "";
  const key = useMemo(() => `result:${category}:${examId}`, [category, examId]);

  const [results, setResults] = useState<BlockResult[] | null>(null);

  // Weighted average is more accurate than averaging percentages.
  const overallPercent = useMemo(() => {
    if (!results || results.length === 0) return null;
    const totalPts = results.reduce((s, r) => s + (typeof r.totalPoints === "number" ? r.totalPoints : r.total), 0);
    const earnedPts = results.reduce((s, r) => s + (typeof r.earnedPoints === "number" ? r.earnedPoints : r.correct), 0);
    if (totalPts > 0) return Math.round((earnedPts / totalPts) * 100);
    // fallback (shouldn't happen): simple average
    return Math.round(results.reduce((s, r) => s + r.percent, 0) / Math.max(results.length, 1));
  }, [results]);

  useEffect(() => {
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { results: BlockResult[] };
      setResults(parsed.results);
    } catch {
      // ignore
    }
  }, [key]);

  return (
    <main className="py-10">
        <Container>
          <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold">Nəticə</h1>
            <p className="mt-2 text-slate-700">Bloklar üzrə faiz nəticələri</p>

            {!results ? (
              <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-slate-700">Nəticə tapılmadı. İmtahanı yenidən başlada bilərsən.</div>
            ) : (
              <>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {results.map((r) => (
                    <div key={r.blockId} className="rounded-2xl bg-white p-5">
                      <div className="text-sm font-semibold">{r.title}</div>
                      <div className="mt-3 text-4xl font-bold tabular-nums">{r.percent}%</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-white p-5 text-sm text-slate-700">
                  <span className="font-semibold">Orta faiz:</span>{" "}
                  <span className="text-base font-extrabold tabular-nums">
                    {overallPercent ?? 0}%
                  </span>
                </div>
              </>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/start/${back || category}`}
                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white sm:w-auto"
              >
                Yeni sınaq seç
              </Link>
              <Link
                href="/"
                className="w-full rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white sm:w-auto"
              >
                Əsas səhifə
              </Link>
            </div>
          </div>
        </Container>
    </main>
  );
}
