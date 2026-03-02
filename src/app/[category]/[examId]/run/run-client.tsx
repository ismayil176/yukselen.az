"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Exam } from "@/lib/exams";
import { ExamRunner } from "@/components/exam/ExamRunner";

export function RunClient({ exam, breakSeconds }: { exam: Exam; breakSeconds: number }) {
  const router = useRouter();
  const resultKey = useMemo(() => `result:${exam.category}:${exam.id}`, [exam.category, exam.id]);
  const attemptKey = useMemo(() => `attempt:${exam.category}:${exam.id}`, [exam.category, exam.id]);

  return (
    <ExamRunner
      exam={exam}
      breakSeconds={breakSeconds}
      onFinish={(results) => {
        // admin panel üçün attempt nəticəsini göndər
        try {
          const attemptId = sessionStorage.getItem(attemptKey);
          if (attemptId) {
            const score = results.reduce((sum, r) => sum + (r.earnedPoints ?? 0), 0);
            const totalQuestions = results.reduce((sum, r) => sum + (r.total ?? 0), 0);
            const correctCount = results.reduce((sum, r) => sum + (r.correct ?? 0), 0);
            fetch("/api/attempts/finish", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ attemptId, score, totalQuestions, correctCount }),
              keepalive: true,
            }).catch(() => {});
          }
        } catch {}

        sessionStorage.setItem(resultKey, JSON.stringify({ results, finishedAt: new Date().toISOString() }));
        router.replace(`/${exam.category}/${exam.id}/result`);
      }}
    />
  );
}
