import { NextResponse } from "next/server";

export const runtime = "nodejs";

// NOTE: This project no longer uses the legacy Prisma/JWT-backed questions API.
// Admin question management is implemented under /api/admin/exams/*.

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Legacy endpoint disabled. Use /api/admin/exams/* instead." },
    { status: 410 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { ok: false, error: "Legacy endpoint disabled. Use /api/admin/exams/* instead." },
    { status: 410 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { ok: false, error: "Legacy endpoint disabled. Use /api/admin/exams/* instead." },
    { status: 410 }
  );
}
