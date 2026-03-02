"use client";

import { useEffect, useState } from "react";

export default function AdminAttempts() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch("/api/admin/attempts?take=100", { cache: "no-store" });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}

    if (!res.ok) {
      setErr(json?.error || "Xəta");
      return;
    }
    setData(json);
  }

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" }).then((r) => {
      if (!r.ok) window.location.href = "/admin/login";
    });
  }, []);

  useEffect(() => {
    load();
    // Auto refresh so admin doesn't need manual page refresh
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-purple-950">İştirakçılar</h2>
            <p className="text-sm text-purple-900/70">Son imtahan cəhdləri və nəticələr.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-white" href="/admin/exams">
              Sınaqlar
            </a>
            <a className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-white" href="/admin/messages">
              Mesajlar
            </a>
            <button
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-white"
              onClick={load}
            >
              Yenilə
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm backdrop-blur">
          {err && <div className="text-red-200 text-sm">{err}</div>}
          {!data && !err && <div className="text-sm text-purple-900/70">Yüklənir...</div>}

          {data?.attempts?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-purple-900/70">
                  <tr>
                    <th className="py-2">Tələbə</th>
                    <th className="py-2">Telefon</th>
                    <th className="py-2">Kateqoriya</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Bal</th>
                    <th className="py-2">Başladı</th>
                    <th className="py-2">Bitdi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a: any) => (
                    <tr key={a.id} className="border-t border-black/10">
                      <td className="py-2">
                        {a.student.firstName} {a.student.lastName} ({a.student.fatherName})
                      </td>
                      <td className="py-2">{a.student.phone}</td>
                      <td className="py-2">{a.category}</td>
                      <td className="py-2">{a.status}</td>
                      <td className="py-2 font-semibold">{a.score}</td>
                      <td className="py-2">
                        {new Date(a.startedAt).toLocaleString()}
                      </td>
                      <td className="py-2">
                        {a.finishedAt ? new Date(a.finishedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.attempts?.length === 0 && <div className="text-sm text-purple-900/70">Hələ iştirakçı yoxdur.</div>}
        </div>
      </div>
    </main>
  );
}
