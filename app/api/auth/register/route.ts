import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, setSessionCookie } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const registerSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  did: z.string().min(10),
  publicKeyMain: z.record(z.string(), z.unknown()),
  publicKeyDistress: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { username: body.username }],
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "Username or email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const created = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        passwordHash,
        did: body.did,
        publicKey: JSON.stringify(body.publicKeyMain),
        distressKey: JSON.stringify(body.publicKeyDistress),
        canary: {
          create: {
            username: body.username,
            thresholdDays: 3,
          },
        },
      },
      include: { canary: true },
    });

    const token = await createSession(created.id);
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: created.id,
        username: created.username,
        email: created.email,
        did: created.did,
      },
      canary: created.canary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
