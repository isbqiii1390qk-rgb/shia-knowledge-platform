import { db } from "@/server/db";
import { notFound } from "next/navigation";

// الملف الشخصي العام — لا معلومات خاصة تُعرض أبدًا (§40)

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await db.user.findUnique({
    where: { usernameLower: params.username.toLowerCase() },
    include: { country: true, statistics: true },
  });
  if (!user) notFound();

  const stats = user.statistics;
  const accuracy =
    stats && stats.totalAnswered > 0
      ? Math.round((stats.correctAnswers / stats.totalAnswered) * 100)
      : 0;

  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <div className="card text-center">
        <h1 className="text-2xl font-extrabold">{user.displayName}</h1>
        <p className="bidi-safe mt-1 text-gray-600" dir="auto">
          @{user.username}
        </p>
        <p className="mt-1 text-gray-600">{user.country.nameAr}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {[
          { label: "المستوى التنافسي", value: stats?.level ?? 1 },
          { label: "التقييم", value: stats?.rating ?? 1000 },
          { label: "الفوز", value: stats?.wins ?? 0 },
          { label: "الخسارة", value: stats?.losses ?? 0 },
          { label: "المباريات", value: stats?.matchesPlayed ?? 0 },
          { label: "الإجابات الصحيحة", value: stats?.correctAnswers ?? 0 },
          { label: "الدقة", value: `${accuracy}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="text-xl font-extrabold text-sky-300">{s.value}</div>
            <div className="mt-1 text-xs font-bold text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        المستوى التنافسي رقم تحفيزي فقط، وليس صفة دينية أو مؤهلًا شرعيًا.
      </p>
    </main>
  );
}