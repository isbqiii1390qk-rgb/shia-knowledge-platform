// الانضمام لقائمة الانتظار — matchmaking حقيقي فقط (§10)
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { statistics: true },
    });
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (!user.rulesAccepted) {
      return NextResponse.json(
        { error: "يجب قبول القواعد أولًا" },
        { status: 403 }
      );
    }

    // هل لدى اللاعب مباراة جارية؟
    const activeMatch = await db.matchPlayer.findFirst({
      where: {
        userId: user.id,
        match: {
          state: { in: ["WAITING_FOR_PLAYER", "MATCH_READY", "QUESTION_ACTIVE", "FIRST_PLAYER_ANSWERING", "SECOND_PLAYER_ANSWERING", "SOURCE_REVIEW", "WAITING_FOR_BOTH_READY"] },
        },
      },
      select: { matchId: true },
    });
    if (activeMatch) {
      return NextResponse.json({
        ok: true,
        status: "FOUND",
        matchId: activeMatch.matchId,
      });
    }

    // ابحث عن مباراة مفتوحة من لاعب آخر
    const openMatch = await db.match.findFirst({
      where: { state: "WAITING_FOR_PLAYER" },
      include: { players: true },
    });

    if (openMatch && !openMatch.players.some((p) => p.userId === user.id) && openMatch.players.length === 1) {
      // انضم إلى المباراة المفتوحة — ذرّيًا
      const joined = await db.$transaction(async (tx) => {
        const fresh = await tx.match.findUnique({
          where: { id: openMatch.id },
          include: { players: true },
        });
        if (!fresh || fresh.state !== "WAITING_FOR_PLAYER" || fresh.players.length >= 2) {
          return null;
        }
        const player = await tx.matchPlayer.create({
          data: { matchId: fresh.id, userId: user.id },
        });
        await tx.match.update({
          where: { id: fresh.id },
          data: { state: "MATCH_READY" },
        });
        await tx.matchEvent.create({
          data: { matchId: fresh.id, type: "PLAYER_JOINED", playerId: player.id },
        });
        return fresh.id;
      });

      if (joined) {
        return NextResponse.json({ ok: true, status: "FOUND", matchId: joined });
      }
    }

    // لا مباراة متاحة — أنشئ مباراة بانتظار لاعب حقيقي
    await db.match.create({
      data: {
        state: "WAITING_FOR_PLAYER",
        players: { create: { userId: user.id } },
      },
    });

    return NextResponse.json({ ok: true, status: "SEARCHING" });
  } catch (e) {
    console.error("matchmaking join error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
