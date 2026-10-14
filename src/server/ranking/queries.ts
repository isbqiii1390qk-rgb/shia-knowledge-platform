import { db } from "@/server/db";

// §39 قاعدة الترتيب الحتمية:
// التقييم ↓ الفوز ↓ المباريات المكتملة ↓ معرف المستخدم المستقر
// الترتيب لا يتغير بين تحديثات الصفحة لنفس البيانات.

export async function getGlobalLeaderboard(page: number, pageSize = 20) {
  const total = await db.userStatistic.count();
  const rows = await db.userStatistic.findMany({
    orderBy: [
      { rating: "desc" },
      { wins: "desc" },
      { matchesPlayed: "desc" },
      { userId: "asc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: { include: { country: true } },
    },
  });
  return { rows, total };
}

export async function getCountryLeaderboard(countryId: string, page: number, pageSize = 20) {
  const total = await db.userStatistic.count({
    where: { user: { countryId } },
  });
  const rows = await db.userStatistic.findMany({
    where: { user: { countryId } },
    orderBy: [
      { rating: "desc" },
      { wins: "desc" },
      { matchesPlayed: "desc" },
      { userId: "asc" },
    ],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: { include: { country: true } },
    },
  });
  return { rows, total };
}