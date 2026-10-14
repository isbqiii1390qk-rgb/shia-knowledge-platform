// حالة البحث عن لاعب
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const myMatch = await db.matchPlayer.findFirst({
      where: {
        userId: session.userId,
        match: { state: { in: ["WAITING_FOR_PLAYER", "MATCH_READY"] } },
      },
      include: { match: { include: { players: { include: { user: { include: { country: true, statistics: true } } } } } } },
    });

    if (!myMatch) {
      return NextResponse.json({ status: "SEARCHING" });
    }

    const match = myMatch.match;
    if (match.state === "MATCH_READY" && match.players.length === 2) {
      const other = match.players.find((p) => p.userId !== session.userId);
      return NextResponse.json({
        status: "FOUND",
        matchId: match.id,
        opponent: other
          ? {
              displayName: other.user.displayName,
              username: other.user.username,
              country: other.user.country.nameAr,
              level: other.user.statistics?.level ?? 1,
              rating: other.user.statistics?.rating ?? 1000,
            }
          : null,
      });
    }

    return NextResponse.json({ status: "SEARCHING", matchId: match.id });
  } catch (e) {
    console.error("matchmaking status error:", e);
    return NextResponse.json({ status: "SEARCHING" });
  }
}
