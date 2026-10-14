import { getGlobalLeaderboard } from "@/server/ranking/queries";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const { rows, total } = await getGlobalLeaderboard(page);
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-extrabold">التصنيف العالمي</h1>

      {rows.length === 0 ? (
        <div className="card mt-8 text-center text-gray-700">
          لم يبدأ التصنيف بعد.
        </div>
      ) : (
        <div className="card mt-8 overflow-x-auto p-0">
          <table className="w-full text-right">
            <thead className="bg-sky-50 text-sm font-bold text-gray-700">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">اللاعب</th>
                <th className="px-4 py-3">الدولة</th>
                <th className="px-4 py-3">المستوى</th>
                <th className="px-4 py-3">التقييم</th>
                <th className="px-4 py-3">الفوز</th>
                <th className="px-4 py-3">المباريات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.userId} className="border-t border-sky-50">
                  <td className="px-4 py-3 font-bold">{(page - 1) * 20 + i + 1}</td>
                  <td className="px-4 py-3">
                    <a href={`/profile/${r.user.username}`} className="font-bold hover:underline">
                      {r.user.displayName}
                    </a>
                    <span className="bidi-safe block text-xs text-gray-500" dir="auto">
                      @{r.user.username}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.user.country.nameAr}</td>
                  <td className="px-4 py-3">{r.level}</td>
                  <td className="px-4 py-3 font-bold text-sky-300">{r.rating}</td>
                  <td className="px-4 py-3">{r.wins}</td>
                  <td className="px-4 py-3">{r.matchesPlayed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          {page > 1 && (
            <a href={`/leaderboard?page=${page - 1}`} className="btn-secondary">
              السابق
            </a>
          )}
          <span className="font-bold text-gray-700">
            صفحة {page} من {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/leaderboard?page=${page + 1}`} className="btn-secondary">
              التالي
            </a>
          )}
        </div>
      )}
    </main>
  );
}