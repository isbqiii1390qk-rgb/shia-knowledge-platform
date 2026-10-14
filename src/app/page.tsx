import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <div className="card w-full max-w-xl">
        <h1 className="text-2xl font-extrabold leading-relaxed md:text-4xl">
          معرفتك العقائدية الشيعية أساس نجاحك
        </h1>
        <p className="mt-6 text-lg leading-loose text-gray-800">
          «منصة معرفية تنافسية تجمع بين التعلم والمراجعة والتحدي المحترم من خلال
          أسئلة مستندة إلى مصادر شيعية موثقة.»
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            ابدأ رحلتك المعرفية
          </Link>
          <Link href="/instructions" className="btn-secondary w-full sm:w-auto">
            كيف تعمل المنصة؟
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-base font-semibold">
          <span className="rounded-full bg-sky-50 px-4 py-2">اقرأ</span>
          <span aria-hidden="true">↓</span>
          <span className="rounded-full bg-sky-50 px-4 py-2">أجب</span>
          <span aria-hidden="true">↓</span>
          <span className="rounded-full bg-sky-50 px-4 py-2">اعرف المصدر</span>
          <span aria-hidden="true">↓</span>
          <span className="rounded-full bg-sky-50 px-4 py-2">تعلّم</span>
          <span aria-hidden="true">↓</span>
          <span className="rounded-full bg-sky-50 px-4 py-2">نافس باحترام</span>
        </div>

        <p className="mt-10 text-sm font-medium text-gray-600">
          المعرفة أولاً، والمنافسة وسيلة للتعلّم.
        </p>
      </div>
    </main>
  );
}
