"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RULES = [
  "هذه المنصة للمعرفة قبل المنافسة — الأسئلة مستندة إلى مصادر شيعية موثقة.",
  "تُعاد صياغة الأسئلة في صورة سؤال مفهوم دون تغيير المعنى الأصلي.",
  "تُعرض الرواية الأصلية ومصدرها بعد مرحلة الإجابة.",
  "المنافسة وسيلة للتعلّم وليست غاية في ذاتها.",
  "احترم الطرف الآخر: لا سبّ، ولا استفزاز مذهبي، ولا غش، ولا تلاعب، ولا سلوك مسيء.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    if (!accepted) return;
    setLoading(true);
    try {
      await fetch("/api/rules/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-extrabold">مرحبًا بك</h1>
        <p className="mt-2 font-bold text-sky-300">المعرفة قبل المنافسة</p>

        <ul className="mt-6 space-y-4">
          {RULES.map((rule) => (
            <li key={rule} className="flex items-start gap-3 rounded-xl bg-sky-50 px-4 py-3">
              <span aria-hidden="true" className="mt-1 text-sky-300">•</span>
              <span className="leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>

        <label className="mt-8 flex items-start gap-3 rounded-xl border border-sky-100 bg-white p-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-5 w-5"
          />
          <span className="font-bold leading-relaxed">
            أقر بأنني قرأت القواعد وألتزم بها
          </span>
        </label>

        <button
          onClick={handleAccept}
          disabled={!accepted || loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? "جارٍ الحفظ..." : "المتابعة إلى لوحة البداية"}
        </button>
      </div>
    </main>
  );
}