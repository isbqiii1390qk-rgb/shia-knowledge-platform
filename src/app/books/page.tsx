import { db } from "@/server/db";

// صفحة المصادر — عرض الكتب المتاحة وطبعاتها (بدون أي محتوى مُخترع)

export default async function BooksPage() {
  const books = await db.book.findMany({
    where: { archived: false },
    include: { editions: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-extrabold">المصادر</h1>
      <p className="mt-2 leading-loose text-gray-700">
        الأسئلة مستندة إلى مصادر شيعية موثقة. تُعرض الرواية الأصلية مع كتابها
        وطبعتها ورقمها بعد كل سؤال — المعرفة أولاً.
      </p>

      {books.length === 0 ? (
        <div className="card mt-8 text-center text-gray-700">
          لم تُضف المصادر بعد.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {books.map((book) => (
            <div key={book.id} className="card">
              <h2 className="text-xl font-extrabold">{book.titleAr}</h2>
              <p className="mt-1 text-sm text-gray-600">{book.authorAr}</p>
              {book.editions.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {book.editions.map((ed) => (
                    <li key={ed.id} className="rounded-xl bg-sky-50 px-4 py-3 text-sm">
                      <span className="font-bold">الطبعة: </span>
                      {ed.titleAr}
                      {ed.publisher ? <span> — {ed.publisher}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">لا طبعات مسجلة بعد.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}