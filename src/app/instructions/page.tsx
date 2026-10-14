import Link from "next/link";

const STEPS = [
  { title: "اقرأ", desc: "يُعرض السؤال المشتق من رواية موثقة على كلا اللاعبين." },
  { title: "أجب", desc: "من يضغط أجيب أولًا يحصل على فرصة الإجابة خلال 25 ثانية." },
  { title: "اعرف المصدر", desc: "بعد الإجابة تُعرض الرواية الأصلية كاملة مع كتابها وطبعتها وصفحتها." },
  { title: "تعلّم", desc: "الهدف الأول هو تعلّم المحتوى الموثق، والنقاط وسيلة تحفيز لا أكثر." },
  { title: "نافس باحترام", desc: "أول من يصل إلى 20 نقطة يفوز، والمنافسة دائمًا باحترام متبادل." },
];

const SCORING = [
  ["الإجابة الصحيحة الأولى", "+2 للذي أجاب"],
  ["إجابة خاطئة من الأول", "-1، والفرصة تنتقل للطرف الآخر"],
  ["الإجابة الصحيحة الثانية", "+1 للذي أجاب"],
  ["انتهاء الوقت", "لا نقاط ولا عقوبة"],
];

export default function InstructionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-extrabold">كيف تعمل المنصة؟</h1>
      <p className="mt-3 leading-loose text-gray-700">
        منصة معرفية تنافسية تجمع بين التعلم والمراجعة والتحدي المحترم من خلال
        أسئلة مستندة إلى مصادر شيعية موثقة. المعرفة أولاً، والمنافسة وسيلة للتعلّم.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="card">
            <h2 className="text-xl font-extrabold">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-2 leading-relaxed text-gray-700">{s.desc}</p>
          </li>
        ))}
      </ol>

      <div className="card mt-8">
        <h2 className="text-xl font-extrabold">نظام النقاط</h2>
        <dl className="mt-4 space-y-3">
          {SCORING.map(([term, value]) => (
            <div key={term} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sky-50 px-4 py-3">
              <dt className="font-bold">{term}</dt>
              <dd className="text-gray-700">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-gray-600">
          أول من يصل إلى 20 نقطة يفوز بالجولة. المستوى التنافسي مجرد رقم تحفيزي
          وليس صفة دينية أو مؤهلًا شرعيًا.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/register" className="btn-primary">
          ابدأ رحلتك المعرفية
        </Link>
      </div>
    </main>
  );
}