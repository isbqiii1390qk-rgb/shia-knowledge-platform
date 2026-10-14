import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { country: true, statistics: true },
  });
  if (!user) redirect("/login");

  if (!user.rulesAccepted) redirect("/onboarding");

  const stats = user.statistics;

  // §39 ترتيب حتمي: التقييم ثم الفوز ثم المباريات ثم المعرف المستقر
  const betterPlayers = await db.userStatistic.count({
    where: {
      OR: [
        { rating: { gt: stats?.rating ?? 0 } },
        {
          rating: stats?.rating ?? 0,
          wins: { gt: stats?.wins ?? 0 },
        },
        {
          rating: stats?.rating ?? 0,
          wins: stats?.wins ?? 0,
          matchesPlayed: { gt: stats?.matchesPlayed ?? 0 },
        },
      ],
    },
  });
  const globalRank = betterPlayers + 1;

  const statsCards = [
    { label: "المستوى التنافسي", value: stats?.level ?? 1 },
    { label: "التقييم", value: stats?.rating ?? 1000 },
    { label: "الفوز", value: stats?.wins ?? 0 },
    { label: "الخسارة", value: stats?.losses ?? 0 },
    { label: "المباريات", value: stats?.matchesPlayed ?? 0 },
    { label: "الإجابات الصحيحة", value: stats?.correctAnswers ?? 0 },
    { label: "الدقة", value: `${stats && stats.totalAnswered > 0 ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100) : 0}%` },
    { label: "الترتيب العالمي", value: `#${globalRank}` },
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-extrabold">{user.displayName}</h1>
        <p className="bidi-safe mt-1 text-gray-600" dir="auto">
          @{user.username} · {user.country.nameAr}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsCards.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-2xl font-extrabold text-sky-300">{s.value}</div>
            <div className="mt-1 text-xs font-bold text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <Link href="/matchmaking" className="btn-primary block text-center">
          ابدأ جولة معرفية
        </Link>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/matchmaking" className="btn-secondary block text-center">
            البحث عن لاعب
          </Link>
          <Link href="/invite" className="btn-secondary block text-center">
            إنشاء رابط دعوة
          </Link>
          <Link href="/leaderboard" className="btn-secondary block text-center">
            لوحة التصنيف
          </Link>
          <Link href={`/profile/${user.username}`} className="btn-secondary block text-center">
            ملفي
          </Link>
          <Link href="/books" className="btn-secondary block text-center">
            المصادر
          </Link>
          <Link href="/settings" className="btn-secondary block text-center">
            الإعدادات
          </Link>
        </div>
      </div>
    </main>
  );
}