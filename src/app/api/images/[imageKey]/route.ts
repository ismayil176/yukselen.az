import { getImageBytes } from "@/lib/imageStore";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: { imageKey: string } }) {
  const key = decodeURIComponent(ctx.params.imageKey || "");
  const meta = await getImageBytes(key);
  if (!meta) return new Response("Not found", { status: 404 });

  const body = new Uint8Array(meta.bytes);

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": meta.contentType || "application/octet-stream",
      // Images are immutable once uploaded (we generate unique keys)
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
