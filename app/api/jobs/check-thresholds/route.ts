import { NextResponse } from "next/server";
import { checkSilenceThresholds } from "@/lib/server/alerting";

export async function POST() {
  const fired = await checkSilenceThresholds();
  return NextResponse.json({ ok: true, fired });
}
