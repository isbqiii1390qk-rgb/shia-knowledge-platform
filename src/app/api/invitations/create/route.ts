// إنشاء دعوة خاصة — رمز آمن تشفيريًا، صلاحية محددة، منع إعادة الاستخدام (§11)
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { generateInvitationToken } from "@/server/match-engine/question-selection";
import { MatchConfig } from "@/server/match-engine/state-machine";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body?.requestId || typeof body.requestId !== "string") {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    // منع إنشاء دعوات مفتوحة متعددة لنفس اللاعب
    const existingOpen = await db.invitation.findFirst({
      where: {
        creatorId: session.userId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });
    if (existingOpen) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      return NextResponse.json({
        ok: true,
        token: existingOpen.token,
        inviteUrl: `${appUrl}/invite/${existingOpen.token}`,
        expiresAt: existingOpen.expiresAt,
      });
    }

    // إنشاء مباراة بانتظار اللاعب الثاني ثم الدعوة
    const match = await db.match.create({
      data: {
        state: "WAITING_FOR_PLAYER",
        players: {
          create: { userId: session.userId },
        },
      },
    });

    const token = generateInvitationToken();
    const invitation = await db.invitation.create({
      data: {
        token,
        matchId: match.id,
        creatorId: session.userId,
        status: "PENDING",
        expiresAt: new Date(Date.now() + MatchConfig.INVITATION_TTL_SECONDS * 1000),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.json(
      {
        ok: true,
        token: invitation.token,
        inviteUrl: `${appUrl}/invite/${invitation.token}`,
        expiresAt: invitation.expiresAt,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("create-invitation error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
