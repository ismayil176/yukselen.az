"use client";

import { use, useEffect, useState } from "react";

export default function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/attempts/${attemptId}/result`, { cache: "no-store" });
      const text = await res.text();

      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        setData({ error: json?.error || `Server error (${res.status})` });
        return;
      }

      setData(json);
    })();
  }, [attemptId]);

  if (!data) return <main className="mx-auto max-w-4xl px-4 py-10">Yüklənir...</main>;
  if (data.error) return <main className="mx-auto max-w-4xl px-4 py-10 text-red-600">{data.error}</main>;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Nəticə</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Düzgün cavablar aşağıdadır.</p>
          </div>
          <a className="text-sm underline" href="/exams">
            Yeni imtahan →
          </a>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 dark:border-zinc-800 mb-6">
          <div className="grid gap-1">
            <div>
              <b>Ad Soyad:</b> {data.attempt.student.firstName} {data.attempt.student.lastName} ({data.attempt.student.fatherName})
            </div>
            <div><b>Kateqoriya:</b> {data.attempt.category}</div>
            <div><b>Bal:</b> <span className="font-semibold">{data.attempt.score}</span></div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Doğru: {data.attempt.stats.correct} · Səhv: {data.attempt.stats.wrong} · Boş: {data.attempt.stats.unanswered}
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-3">Düzgün cavablar</h3>
        <div className="grid gap-3">
          {data.details.map((x: any) => (
            <div key={x.orderIndex} className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
              <div className="font-semibold mb-2">
                Sual {x.orderIndex}: {x.questionText}
              </div>
              <div className="text-sm grid gap-1">
                <div><b>Seçdiyin:</b> {x.selectedOption ?? "—"}</div>
                <div><b>Düzgün:</b> {x.correctOption}</div>
                <div><b>Bal:</b> {x.earnedPoints}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
