"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exam } from "@/lib/exams";
import type { SectionKey, Question } from "@/lib/store";

export type BlockResult = {
  blockId: string;
  title: string;
  total: number; // sual sayı (informativ)
  correct: number; // sual sayı (informativ)
  totalPoints: number;
  earnedPoints: number;
  percent: number;
};

type Props = {
  exam: Exam;
  breakSeconds: number;
  onFinish: (results: BlockResult[]) => void;
};

type Step =
  | { kind: "SECTION"; section: SectionKey; title: string; durationSeconds: number }
  | { kind: "BREAK"; title: string; durationSeconds: number };

function formatTime(s: number) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ExamRunner({ exam, breakSeconds, onFinish }: Props) {
  const steps: Step[] = useMemo(() => {
    if (exam.category === "general") {
      const sec: Step[] = [
        { kind: "SECTION", section: "BLOK_1", title: "Blok 1", durationSeconds: 18 * 60 },
        { kind: "BREAK", title: "Fasilə", durationSeconds: breakSeconds },
        { kind: "SECTION", section: "BLOK_2", title: "Blok 2", durationSeconds: 18 * 60 },
        { kind: "BREAK", title: "Fasilə", durationSeconds: breakSeconds },
        { kind: "SECTION", section: "BLOK_3", title: "Blok 3", durationSeconds: 18 * 60 },
        { kind: "BREAK", title: "Fasilə", durationSeconds: breakSeconds },
        { kind: "SECTION", section: "BLOK_4", title: "Blok 4", durationSeconds: 18 * 60 },
      ];
      return sec;
    }

    if (exam.category === "analytic") {
      return [
        { kind: "SECTION", section: "VERBAL_1", title: "Verbal – Mətn 1", durationSeconds: 12 * 60 },
        { kind: "SECTION", section: "VERBAL_2", title: "Verbal – Mətn 2", durationSeconds: 12 * 60 },
        { kind: "SECTION", section: "VERBAL_3", title: "Verbal – Mətn 3", durationSeconds: 12 * 60 },
        { kind: "SECTION", section: "VERBAL_4", title: "Verbal – Mətn 4", durationSeconds: 12 * 60 },
        { kind: "SECTION", section: "VERBAL_5", title: "Verbal – Mətn 5", durationSeconds: 12 * 60 },
        { kind: "SECTION", section: "ABSTRACT", title: "Abstract (25 sual)", durationSeconds: 50 * 60 },
        { kind: "SECTION", section: "NUMERIC", title: "Rəqəmsal (25 sual)", durationSeconds: 75 * 60 },
      ];
    }

    return [];
  }, [exam.category, breakSeconds]);

  const [idx, setIdx] = useState(0);
  const step = steps[idx];

  const [timeLeft, setTimeLeft] = useState(step?.durationSeconds ?? 0);
  const timerRef = useRef<number | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [passage, setPassage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<BlockResult[]>([]);
  const [qIdx, setQIdx] = useState(0);

  // Best-effort: discourage screenshots / copying during the exam.
  // NOTE: Browsers cannot reliably block OS-level screenshots.
  const [guardMsg, setGuardMsg] = useState<string | null>(null);

  // Only enable the best-effort protection while questions are visible.
  // (During BREAK and after navigating away, screenshots work normally.)
  const protectionEnabled = step?.kind === "SECTION";

  useEffect(() => {
    // Enable best-effort "exam mode" only while questions are visible.
    if (!protectionEnabled) {
      document.body.classList.remove("exam-mode");
      setGuardMsg(null);
      return;
    }

    document.body.classList.add("exam-mode");
    setGuardMsg(null);

    const keydownOpts: AddEventListenerOptions = { capture: true };
    const onContextMenu = (e: Event) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setGuardMsg("Kopyalama bu mərhələdə deaktivdir.");
    };
    const onKeyDown = async (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      const isPrintScreen = key === "printscreen";
      const isDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key);
      const isSave = (e.ctrlKey || e.metaKey) && key === "s";
      const isPrint = (e.ctrlKey || e.metaKey) && key === "p";

      if (isPrintScreen || isDevTools || isSave || isPrint) {
        e.preventDefault();
        setGuardMsg("İmtahan zamanı ekran görüntüsü / çıxarış almaq məhdudlaşdırılıb.");
        // Best-effort: clear clipboard for PrintScreen on supporting browsers.
        try {
          if (isPrintScreen && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText("");
          }
        } catch {
          // ignore
        }
      }
    };
    const onVisibility = () => {
      if (document.hidden) {
        setGuardMsg("İmtahan aktivdir. Zəhmət olmasa bu səhifəni tərk etmə.");
      }
    };
    const onBeforePrint = () => setGuardMsg("Çap etmək məhdudlaşdırılıb.");

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCopy);
    window.addEventListener("keydown", onKeyDown, keydownOpts);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      document.body.classList.remove("exam-mode");
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCopy);
      window.removeEventListener("keydown", onKeyDown, keydownOpts);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [protectionEnabled]);

  // load step questions
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!step || step.kind !== "SECTION") {
        setQuestions([]);
        setAnswers({});
        setPassage(null);
        setQIdx(0);
        return;
      }
      const qRes = await fetch(`/api/questions?examId=${encodeURIComponent(exam.id)}&section=${encodeURIComponent(step.section)}`);
      const qJson = await qRes.json();
      const qs = (qJson?.questions ?? []) as Question[];

      const isVerbal = step.section.startsWith("VERBAL_");
      let pText: string | null = null;
      if (isVerbal) {
        const pRes = await fetch(`/api/verbal?examId=${encodeURIComponent(exam.id)}&section=${encodeURIComponent(step.section)}`);
        const pJson = await pRes.json();
        pText = (pJson?.passage ?? null) as string | null;
      }
      if (!cancelled) {
        setQuestions(qs);
        setAnswers({});
        setPassage(pText);
        setQIdx(0);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [exam.id, step]);

  // reset timer per step
  useEffect(() => {
    if (!step) return;
    setTimeLeft(step.durationSeconds);
    if (timerRef.current) window.clearInterval(timerRef.current);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [step]);

  // auto finish step when time is up
  useEffect(() => {
    if (!step) return;
    if (timeLeft !== 0) return;

    if (step.kind === "BREAK") {
      goNext();
      return;
    }

    finalizeSection(step.section, step.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, step]);

  function calcSectionResult(section: SectionKey, title: string): BlockResult {
    const qs = questions;
    const total = qs.length;
    let correct = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    for (const q of qs) {
      const qScore = Number.isFinite((q as any).score) && (q as any).score > 0 ? (q as any).score : 1;
      totalPoints += qScore;
      const ans = answers[q.id];
      if (typeof ans === "number" && ans === q.correctIndex) {
        correct += 1;
        earnedPoints += qScore;
      }
    }
    const percent = totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
    return { blockId: section, title, total, correct, totalPoints, earnedPoints, percent };
  }

  function finalizeSection(section: SectionKey, title: string) {
    const r = calcSectionResult(section, title);
    const current = resultsRef.current;
    const nextResults = [...current, r];
    setResults(nextResults);

    const isLastStep = idx >= steps.length - 1;
    if (isLastStep) {
      onFinish(nextResults);
      return;
    }

    goNext();
  }

  function goNext() {
    setIdx((p) => {
      const next = p + 1;
      if (next >= steps.length) {
        onFinish(resultsRef.current);
        return p; // keep
      }
      return next;
    });
  }

  const resultsRef = useRef<BlockResult[]>([]);
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  if (!step) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
        <div className="text-lg font-bold">İmtahan tapılmadı</div>
      </div>
    );
  }

  if (step.kind === "BREAK") {
    const mins = Math.max(0, Math.round((breakSeconds || step.durationSeconds) / 60));
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-700">Fasilə</div>
            <div className="mt-1 text-2xl font-extrabold text-purple-950">{formatTime(timeLeft)}</div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white"
            onClick={() => goNext()}
          >
            Növbəti bloka keç
          </button>
        </div>
        <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-slate-700">
          İstəsən, {mins} dəqiqə gözləmədən dərhal növbəti bloka keçə bilərsən.
        </div>
      </div>
    );
  }

  // SECTION
  const currentQ = questions[qIdx];
  const totalQ = questions.length;
  const canPrev = qIdx > 0;
  const canNext = qIdx < totalQ - 1;

  return (
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-black/10 bg-white p-4 sm:p-6 lg:p-8">

      {guardMsg ? (
        <div className="mb-4 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-purple-950">
          {guardMsg}
          <button
            type="button"
            className="ml-3 inline-flex rounded-xl border border-black/10 bg-white px-3 py-1 text-xs font-bold"
            onClick={() => setGuardMsg(null)}
          >
            Bağla
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-sm text-slate-700">{exam.title}</div>
          <div className="mt-1 text-xl font-extrabold text-purple-950">{step.title}</div>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 sm:px-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Vaxt</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums text-purple-950">{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {passage ? (
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">Mətn</div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{passage}</div>
          </div>
        ) : null}

        {questions.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-slate-700">
            Bu bölmə üçün sual əlavə edilməyib.
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-purple-950 leading-relaxed">
                {qIdx + 1}. {currentQ?.text}
                <span className="ml-2 text-xs font-semibold text-slate-700">({((currentQ as any)?.score ?? 1) as number} bal)</span>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Sual {qIdx + 1} / {totalQ}
              </div>
            </div>

            {(currentQ as any)?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(currentQ as any).image as string}
                alt="question"
                className="mt-3 max-h-72 w-auto max-w-full rounded-xl border border-black/10"
              />
            ) : null}

            <div className="mt-4 grid gap-2">
              {currentQ?.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 hover:bg-white"
                >
                  <input
                    type="radio"
                    name={currentQ.id}
                    checked={answers[currentQ.id] === oi}
                    onChange={() => setAnswers((p) => ({ ...p, [currentQ.id]: oi }))}
                    className="mt-1"
                  />
                  <span className="text-sm leading-relaxed text-slate-700">{opt}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="w-full rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={!canPrev}
                onClick={() => setQIdx((p) => Math.max(0, p - 1))}
              >
                Əvvəlki
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                disabled={!canNext}
                onClick={() => setQIdx((p) => Math.min(totalQ - 1, p + 1))}
              >
                Növbəti
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white sm:w-auto"
          onClick={() => finalizeSection(step.section, step.title)}
        >
          Bu bloku bitir
        </button>
      </div>
    </div>
  );
}
