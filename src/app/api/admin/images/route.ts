import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { saveImage } from "@/lib/imageStore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data lazımdır" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Bad form" }, { status: 400 });

  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "file tapılmadı" }, { status: 400 });

  const f = file as File;
  const bytes = await f.arrayBuffer();
  const contentType = f.type || "application/octet-stream";

  // very basic guard (avoid huge payloads)
  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Şəkil çox böyükdür (max 5MB)." }, { status: 400 });
  }

  try {
    const saved = await saveImage({ bytes, contentType });
    // Serve through our API route so it works with PRIVATE blob stores.
    const proxiedUrl = `/api/images/${encodeURIComponent(saved.imageKey)}`;
    return NextResponse.json({ ok: true, imageKey: saved.imageKey, imageUrl: proxiedUrl });
  } catch (e: any) {
    const msg = typeof e?.message === "string" ? e.message : "Şəkil yüklənmədi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
