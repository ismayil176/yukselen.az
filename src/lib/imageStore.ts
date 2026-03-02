import "server-only";

import { randomUUID } from "crypto";
import { deleteImageRow, getImage, putImage } from "@/lib/railwayDb";

function extFromContentType(contentType: string): string {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("image/webp")) return "webp";
  if (ct.includes("image/png")) return "png";
  if (ct.includes("image/jpeg") || ct.includes("image/jpg")) return "jpg";
  if (ct.includes("image/gif")) return "gif";
  return "bin";
}

export async function saveImage(opts: {
  bytes: ArrayBuffer;
  contentType: string;
}): Promise<{ imageKey: string; url: string }> {
  const ext = extFromContentType(opts.contentType);
  const imageKey = `img_${randomUUID()}.${ext}`;

  await putImage({
    imageKey,
    contentType: opts.contentType || "application/octet-stream",
    bytes: Buffer.from(opts.bytes),
  });

  // Always serve via our API route.
  const proxiedUrl = `/api/images/${encodeURIComponent(imageKey)}`;
  return { imageKey, url: proxiedUrl };
}

export async function getImageBytes(
  imageKey: string
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!imageKey) return null;
  const row = await getImage(imageKey);
  if (!row) return null;
  return {
    bytes: row.bytes,
    contentType: row.content_type || "application/octet-stream",
  };
}

/**
 * Deletes an image row from Postgres (best-effort).
 */
export async function deleteImage(imageKey: string): Promise<void> {
  if (!imageKey) return;
  try {
    await deleteImageRow(imageKey);
  } catch {
    // ignore
  }
}
