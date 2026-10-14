// إلغاء البحث عن لاعب — إلغاء المباراة المعلقة بأمان
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const myMatch = await db.matchPlayer.findFirst({
      where: {
        userId: session.userId,
        match: { state: "WAITING_FOR_PLAYER" },
      },
      select: { matchId: true },
    });

    if (myMatch) {
      // فقط مباراة الانتظار وحيدة اللاعب تُلغى — المباريات الجارية لا تمس
      const match = await db.match.findUnique({
        where: { id: myMatch.matchId },
        include: { players: true },
      });
      if (match && match.state === "WAITING_FOR_PLAYER" && match.players.length === 1) {
        await db.$transaction([
          db.match.update({
            where: { id: match.id },
            data: { state: "CANCELLED", cancelledAt: new Date(), cancelReason: "creator-cancelled" },
          }),
          db.matchEvent.create({
            data: { matchId: match.id, type: "MATCH_CANCELLED" },
          }),
        ]);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("matchmaking cancel error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
