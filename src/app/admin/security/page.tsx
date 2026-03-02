"use client";

import { useEffect, useState } from "react";

export default function AdminSecurityPage() {
  const [newUser, setNewUser] = useState("admin");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);

  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backupErr, setBackupErr] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [backupJsonFile, setBackupJsonFile] = useState<File | null>(null);
  const [backupXlsxFile, setBackupXlsxFile] = useState<File | null>(null);

  useEffect(() => {
    fetch("/api/admin/me", { cache: "no-store" }).then((r) => {
      if (!r.ok) window.location.href = "/admin/login";
    });
  }, []);

  return (
    <main className="min-h-[calc(100vh-72px)]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Admin təhlükəsizlik</h1>
            </div>
            <a className="text-sm underline" href="/admin/exams">
              ← Admin
            </a>
          </div>

          <div className="mt-6 grid gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Yeni istifadəçi adı</span>
              <input
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                className="border border-black/10 rounded-xl p-3 bg-white"
                placeholder="Məs: admin"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Yeni şifrə</span>
              <input
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                type="password"
                className="border border-black/10 rounded-xl p-3 bg-white"
                placeholder="Güclü şifrə seç"
              />
            </label>

            <button
              className="rounded-xl bg-black text-white px-4 py-3 font-semibold disabled:opacity-60"
              disabled={saving || !newUser.trim() || !newPass.trim()}
              onClick={async () => {
                setErr(null);
                setOkMsg(null);
                setSaving(true);
                try {
                  const r = await fetch("/api/admin/security/credentials", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ username: newUser.trim(), password: newPass }),
                  });
                  const j = await r.json().catch(() => null);
                  if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Xəta");
                  setOkMsg("Yadda saxlandı. Növbəti login bu məlumatlarla olacaq.");
                  setNewPass("");
                } catch (e: any) {
                  setErr(e?.message ?? "Xəta");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saxlanılır..." : "Saxla (saytda)"}
            </button>

            {okMsg ? <div className="text-sm text-green-700">{okMsg}</div> : null}
            {err ? <div className="text-sm text-red-700">{err}</div> : null}
          </div>

          <div className="mt-10 border-t border-black/10 pt-6">
            <h2 className="text-lg font-bold">Sualların backup / import</h2>
            <p className="mt-2 text-sm text-slate-700">
              2 variant var: <b>JSON</b> (yüngül) və <b>Excel (.xlsx)</b> (tam).
              Excel backup sualları <i>və</i> şəkilləri də saxlayır (base64 kimi) — sonra eyni Excel faylı ilə import edə bilərsiniz.
            </p>

            <div className="mt-4 grid gap-3">
              {/* JSON */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="rounded-xl bg-white border border-black/10 px-4 py-3 font-semibold"
                onClick={async () => {
                  setBackupErr(null);
                  setBackupMsg(null);
                  try {
                    const r = await fetch("/api/admin/backup/export", { cache: "no-store" });
                    if (!r.ok) throw new Error("Export alınmadı");
                    const blob = await r.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `questions-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    setBackupMsg("Backup yükləndi ✅");
                  } catch (e: any) {
                    setBackupErr(e?.message ?? "Xəta");
                  }
                }}
              >
                Backup export et (JSON)
              </button>

              <label className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="block w-full text-sm"
                  onChange={(e) => setBackupJsonFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <button
                className="rounded-xl bg-black text-white px-4 py-3 font-semibold disabled:opacity-60"
                disabled={importing || !backupJsonFile}
                onClick={async () => {
                  if (!backupJsonFile) return;
                  if (!confirm("Import zamanı mövcud suallar əvəzlənəcək. Davam edək?")) return;
                  setBackupErr(null);
                  setBackupMsg(null);
                  setImporting(true);
                  try {
                    const fd = new FormData();
                      fd.append("file", backupJsonFile);
                    const r = await fetch("/api/admin/backup/import", { method: "POST", body: fd });
                    const j = await r.json().catch(() => null);
                    if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Import alınmadı");
                    setBackupMsg(`Import olundu ✅ (suallar: ${j.restored?.questions ?? "?"})`);
                    setBackupJsonFile(null);
                  } catch (e: any) {
                    setBackupErr(e?.message ?? "Xəta");
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                {importing ? "Import edilir..." : "Import et"}
              </button>
              </div>

              {/* Excel */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  className="rounded-xl bg-white border border-black/10 px-4 py-3 font-semibold"
                  onClick={async () => {
                    setBackupErr(null);
                    setBackupMsg(null);
                    try {
                      const r = await fetch("/api/admin/backup/export-xlsx", { cache: "no-store" });
                      if (!r.ok) {
                        const j = await r.json().catch(() => null);
                        throw new Error(j?.error ?? "Excel export alınmadı");
                      }
                      const blob = await r.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `questions-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                      setBackupMsg("Excel backup yükləndi ✅");
                    } catch (e: any) {
                      setBackupErr(e?.message ?? "Xəta");
                    }
                  }}
                >
                  Backup export et (Excel)
                </button>

                <label className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">
                  <input
                    type="file"
                    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
                    className="block w-full text-sm"
                  onChange={(e) => setBackupXlsxFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <button
                  className="rounded-xl bg-black text-white px-4 py-3 font-semibold disabled:opacity-60"
                  disabled={importing || !backupXlsxFile}
                  onClick={async () => {
                    if (!backupXlsxFile) return;
                    if (!confirm("Excel import zamanı mövcud suallar əvəzlənəcək. Davam edək?")) return;
                    setBackupErr(null);
                    setBackupMsg(null);
                    setImporting(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", backupXlsxFile);
                      const r = await fetch("/api/admin/backup/import-xlsx", { method: "POST", body: fd });
                      const j = await r.json().catch(() => null);
                      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Excel import alınmadı");
                      setBackupMsg(
                        `Excel import olundu ✅ (suallar: ${j.restored?.questions ?? "?"}, şəkillər: ${j.restored?.images ?? 0})`
                      );
                      setBackupXlsxFile(null);
                    } catch (e: any) {
                      setBackupErr(e?.message ?? "Xəta");
                    } finally {
                      setImporting(false);
                    }
                  }}
                >
                  {importing ? "Import edilir..." : "Excel Import"}
                </button>
              </div>
            </div>

            {backupMsg ? <div className="mt-3 text-sm text-green-700">{backupMsg}</div> : null}
            {backupErr ? <div className="mt-3 text-sm text-red-700">{backupErr}</div> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
