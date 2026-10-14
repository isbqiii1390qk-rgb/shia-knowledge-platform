// صفحة المباراة الحية — العرض فقط؛ كل الحسم على الخادم (§42)
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import MatchClient from "./MatchClient";

export default async function MatchPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const mp = await db.matchPlayer.findFirst({
    where: { matchId: params.id, userId: session.userId },
    include: {
      match: {
        include: {
          players: {
            include: { user: { include: { country: true } } },
          },
        },
      },
    },
  });
  if (!mp) notFound();

  const opponent = mp.match.players.find((p) => p.id !== mp.id);

  return (
    <MatchClient
      matchId={params.id}
      myPlayerId={mp.id}
      myScore={mp.score}
      opponentName={opponent?.user.displayName ?? "الطرف الآخر"}
      opponentScore={opponent?.score ?? 0}
    />
  );
}