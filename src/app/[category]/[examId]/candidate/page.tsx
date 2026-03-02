"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type HTMLAttributes } from "react";
import { Container } from "@/components/Container";

export default function CandidatePage({ params }: { params: { category: string; examId: string } }) {
  const router = useRouter();
  const { category, examId } = params;

  const storageKey = useMemo(() => `candidate:${category}:${examId}`, [category, examId]);
  const attemptKey = useMemo(() => `attempt:${category}:${examId}`, [category, examId]);

  const [form, setForm] = useState({ firstName: "", lastName: "", fatherName: "", phone: "" });

  return (
    <main className="min-h-[calc(100vh-72px)] py-8 sm:py-10">
      <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-purple-950">Məlumatlar</h1>
            <p className="mt-2 text-slate-700">İmtahana başlamaq üçün məlumatları doldur.</p>

            <div className="mt-6 grid gap-4">
              <Field label="Ad" value={form.firstName} onChange={(v) => setForm((p) => ({ ...p, firstName: v }))} />
              <Field label="Soyad" value={form.lastName} onChange={(v) => setForm((p) => ({ ...p, lastName: v }))} />
              <Field label="Ata adı" value={form.fatherName} onChange={(v) => setForm((p) => ({ ...p, fatherName: v }))} />
              <Field
                label="Nömrə"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="(+994...)"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-950 hover:bg-white"
                onClick={() => {
                  if (!form.firstName.trim() || !form.lastName.trim() || !form.fatherName.trim() || !form.phone.trim()) {
                    alert("Zəhmət olmasa bütün sahələri doldurun.");
                    return;
                  }
                  (async () => {
                    try {
                      // attempt yaradıb admin panel üçün saxlayırıq
                      const res = await fetch("/api/attempts", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ examId, category, student: form }),
                      });
                      const j = await res.json().catch(() => ({}));
                      if (!res.ok || !j.ok) throw new Error(j.error || "Attempt yaradılmadı");

                      sessionStorage.setItem(storageKey, JSON.stringify(form));
                      sessionStorage.setItem(attemptKey, String(j.attemptId));
                      router.push(`/${category}/${examId}/instructions`);
                    } catch (e: any) {
                      alert(e?.message ?? "Xəta");
                    }
                  })();
                }}
              >
                İmtahana başla
              </button>
            </div>
          </div>
      </Container>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-700 outline-none focus:border-black/10"
      />
    </label>
  );
}
