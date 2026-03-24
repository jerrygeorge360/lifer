import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(_: Request, context: { params: Promise<{ username: string }> }) {
  const { username } = await context.params;
  const canary = await prisma.canary.findUnique({
    where: { username },
    include: {
      accounts: true,
      attestations: { orderBy: { timestamp: "desc" }, take: 10 },
    },
  });

  if (!canary) {
    return NextResponse.json({ error: "Canary not found." }, { status: 404 });
  }

  return NextResponse.json({ canary });
}
