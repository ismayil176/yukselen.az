"use client";

import { use, useEffect, useMemo, useState } from "react";

type CurrentPayload =
  | { status: "FINISHED" }
  | {
      status: "IN_PROGRESS";
      attempt: { id: string; score: number; currentIndex: number; totalQuestions: number };
      question: {
        id: string;
        text: string;
        imageUrl?: string | null;
        options: Record<"A" | "B" | "C" | "D" | "E", string>;
      };
      remainingSeconds: number;
      expiresAt: string;
    };

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);

  const [data, setData] = useState<CurrentPayload | null>(null);
  const [selected, setSelected] = useState<null | "A" | "B" | "C" | "D" | "E">(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  async function load() {
    setErr(null);
    const res = await fetch(`/api/attempts/${attemptId}/current`, { cache: "no-store" });
    const text = await res.text();

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      setErr(json?.error || `Server error (${res.status})`);
      return;
    }

    setData(json);
    setSelected(null);
    setTick(0);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = useMemo(() => {
    if (!data || data.status !== "IN_PROGRESS") return 0;
    return Math.max(0, data.remainingSeconds - tick);
  }, [data, tick]);

  useEffect(() => {
    if (data?.status === "IN_PROGRESS" && remaining === 0) load();
  }, [remaining]);

  async function next() {
    if (!data || data.status !== "IN_PROGRESS") return;
    if (!selected) {
      setErr("Variant seç");
      return;
    }

    setErr(null);
    const res = await fetch(`/api/attempts/${attemptId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOption: selected }),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      setErr(json?.error || `Server error (${res.status})`);
      await load();
      return;
    }

    if (json?.status === "FINISHED") {
      window.location.href = `/result/${attemptId}`;
      return;
    }

    await load();
  }

  if (!data) {
    return (
      <main className="min-h-[calc(100vh-72px)] bg-gray-100">
        <div className="mx-auto max-w-3xl px-4 py-10">
          {err ? <div className="text-red-600">{err}</div> : "Yüklənir..."}
        </div>
      </main>
    );
  }

  if (data.status === "FINISHED") {
    if (typeof window !== "undefined") window.location.href = `/result/${attemptId}`;
    return null;
  }

  const qNo = data.attempt.currentIndex + 1;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-gray-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Sual <b className="text-purple-950 dark:text-zinc-100">{qNo}</b> / {data.attempt.totalQuestions}
          </div>
          <div className="rounded-full border bg-white px-3 py-1 font-bold dark:bg-zinc-950 dark:border-zinc-800">
            {fmt(remaining)}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
          <div className="text-lg font-semibold mb-4">{data.question.text}</div>

          {data.question.imageUrl && (
            <img
              src={data.question.imageUrl}
              alt="Sual şəkli"
              className="mb-4 rounded-xl border dark:border-zinc-800"
            />
          )}

          <div className="grid gap-2">
            {(["A", "B", "C", "D", "E"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={`text-left rounded-xl border p-3 hover:shadow-sm transition dark:border-zinc-800 ${
                  selected === k ? "border-black" : ""
                }`}
              >
                <b className="mr-2">{k})</b> {data.question.options[k]}
              </button>
            ))}
          </div>

          {err && <div className="text-red-600 text-sm mt-3">{err}</div>}

          <div className="mt-5 flex justify-end">
            <button
              onClick={next}
              className="rounded-xl border border-black/10 bg-white px-5 py-3 font-semibold text-purple-950 hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
