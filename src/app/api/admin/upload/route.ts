import { isAdminRequest } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import { saveImage } from "@/lib/imageStore";

export const runtime = "nodejs";

function requireAdmin() {
  if (!isAdminRequest()) throw new Error("Unauthorized");
}

export async function POST(req: Request) {
  try {
    requireAdmin();

    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const contentType = (file as File).type || "application/octet-stream";
    const ab = await (file as File).arrayBuffer();

    const { imageKey, url } = await saveImage({ bytes: ab, contentType });

    return NextResponse.json({ ok: true, imageKey, url });
  } catch (e: any) {
    const msg = e?.message || "Upload failed";
    const status = msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
