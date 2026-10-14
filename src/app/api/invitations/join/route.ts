// الانضمام عبر دعوة — منع الانضمام لنفسك، منع الاستخدام بعد البدء أو الانتهاء (§11)
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { invitationJoinSchema } from "@/server/validation/schemas";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = invitationJoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "رابط الدعوة غير صالح" }, { status: 400 });
    }

    const invitation = await db.invitation.findUnique({
      where: { token: parsed.data.token },
      include: { match: true },
    });
    if (!invitation) {
      return NextResponse.json({ error: "رابط الدعوة غير موجود" }, { status: 404 });
    }

    // منع الانضمام لنفسك
    if (invitation.creatorId === session.userId) {
      return NextResponse.json(
        { error: "لا يمكنك الانضمام إلى دعوتك الخاصة" },
        { status: 400 }
      );
    }

    // منع الاستخدام بعد انتهاء الصلاحية
    if (invitation.expiresAt < new Date()) {
      await db.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "انتهت صلاحية رابط الدعوة" }, { status: 410 });
    }

    // منع الاستخدام بعد بدء المباراة أو انتهائها
    if (
      invitation.status !== "PENDING" ||
      invitation.match.state !== "WAITING_FOR_PLAYER"
    ) {
      return NextResponse.json(
        { error: "هذه الدعوة لم تعد صالحة" },
        { status: 409 }
      );
    }

    // منع الانضمام إذا كانت المباراة ممتلئة
    const playerCount = await db.matchPlayer.count({
      where: { matchId: invitation.matchId },
    });
    if (playerCount >= 2) {
      return NextResponse.json(
        { error: "المباراة ممتلئة بالفعل" },
        { status: 409 }
      );
    }

    // المعاملة: الانضمام + تحديث الحالة معًا — ذرّية
    const result = await db.$transaction(async (tx) => {
      const player = await tx.matchPlayer.create({
        data: { matchId: invitation.matchId, userId: session.userId },
      });

      await tx.match.update({
        where: { id: invitation.matchId },
        data: { state: "MATCH_READY" },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "JOINED", joinerId: session.userId, usedAt: new Date() },
      });

      await tx.matchEvent.create({
        data: {
          matchId: invitation.matchId,
          type: "PLAYER_JOINED",
          playerId: player.id,
        },
      });

      return { matchId: invitation.matchId };
    });

    return NextResponse.json({ ok: true, matchId: result.matchId });
  } catch (e) {
    console.error("join-invitation error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
