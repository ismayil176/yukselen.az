export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { readDb } from "@/lib/store";

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await readDb();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    db,
  };

  return NextResponse.json(payload, {
    headers: {
      // Make browsers download it as a file.
      "content-disposition": `attachment; filename="questions-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
