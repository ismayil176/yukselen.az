import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, isAdmin: isAdminRequest() });
}
