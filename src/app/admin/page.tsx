// لوحة الإدارة — حماية من جهة الخادم فقط (§54)
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await isAdmin();
  if (!admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="card text-center">
          <h1 className="text-xl font-extrabold">غير مصرح</h1>
          <p className="mt-3 text-gray-700">
            هذه الصفحة للمشرفين فقط.
          </p>
          <Link href="/dashboard" className="btn-secondary mt-6 inline-block">
            العودة للوحة البداية
          </Link>
        </div>
      </main>
    );
  }

  const [books, questions, reports] = await Promise.all([
    db.book.count(),
    db.question.count(),
    db.report.findMany({ where: { status: "OPEN" }, take: 10 }),
  ]);

  const drafts = await db.question.groupBy({
    by: ["verificationStatus"],
    _count: { _all: true },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-extrabold">لوحة الإدارة</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 text-center shadow-card">
          <div className="text-2xl font-extrabold text-sky-300">{books}</div>
          <div className="mt-1 text-xs font-bold text-gray-600">الكتب</div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-card">
          <div className="text-2xl font-extrabold text-sky-300">{questions}</div>
          <div className="mt-1 text-xs font-bold text-gray-600">الأسئلة</div>
        </div>
        <div className="rounded-2xl bg-white p-4 text-center shadow-card">
          <div className="text-2xl font-extrabold text-sky-300">{reports.length}</div>
          <div className="mt-1 text-xs font-bold text-gray-600">بلاغات مفتوحة</div>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-extrabold">حالة الأسئلة</h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-gray-700">لا أسئلة بعد.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {drafts.map((d) => (
              <li key={d.verificationStatus} className="flex justify-between rounded-xl bg-sky-50 px-4 py-3">
                <span className="font-bold">{d.verificationStatus}</span>
                <span>{d._count._all}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-extrabold">إدارة المحتوى</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          إدارة الكتب والطبعات والأبواب والروايات والأسئلة ودورة التحقق
          (DRAFT → UNDER_REVIEW → VERIFIED → PUBLISHED) — لا يدخل أي سؤال اللعبة
          قبل التحقق البشري من المصدر.
        </p>
      </div>
    </main>
  );
}