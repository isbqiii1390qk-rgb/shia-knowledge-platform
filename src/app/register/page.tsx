"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = [
  { code: "SA", nameAr: "السعودية" },
  { code: "IQ", nameAr: "العراق" },
  { code: "IR", nameAr: "إيران" },
  { code: "LB", nameAr: "لبنان" },
  { code: "BH", nameAr: "البحرين" },
  { code: "KW", nameAr: "الكويت" },
  { code: "SY", nameAr: "سوريا" },
  { code: "YE", nameAr: "اليمن" },
  { code: "EG", nameAr: "مصر" },
  { code: "JO", nameAr: "الأردن" },
  { code: "AE", nameAr: "الإمارات" },
  { code: "QA", nameAr: "قطر" },
  { code: "OM", nameAr: "عُمان" },
  { code: "MA", nameAr: "المغرب" },
  { code: "DZ", nameAr: "الجزائر" },
  { code: "TN", nameAr: "تونس" },
  { code: "LY", nameAr: "ليبيا" },
  { code: "SD", nameAr: "السودان" },
  { code: "PK", nameAr: "باكستان" },
  { code: "IN", nameAr: "الهند" },
  { code: "AF", nameAr: "أفغانستان" },
  { code: "TR", nameAr: "تركيا" },
  { code: "US", nameAr: "الولايات المتحدة" },
  { code: "GB", nameAr: "المملكة المتحدة" },
  { code: "CA", nameAr: "كندا" },
  { code: "DE", nameAr: "ألمانيا" },
  { code: "SE", nameAr: "السويد" },
  { code: "AU", nameAr: "أستراليا" },
  { code: "MY", nameAr: "ماليزيا" },
  { code: "ID", nameAr: "إندونيسيا" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.nameAr.includes(countrySearch.trim())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, country, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ غير متوقع. حاول مرة أخرى.");
        return;
      }
      router.push("/onboarding");
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من اتصالك.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-extrabold">إنشاء حساب جديد</h1>
        <p className="mt-2 text-sm text-gray-600">
          المعرفة قبل المنافسة — أنشئ حسابك وابدأ رحلتك المعرفية.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="displayName" className="block font-bold">
              الاسم المعروض
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="محمد علي أو Mohammed Ali"
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-lg focus-visible:outline-sky-200"
            />
          </div>

          <div>
            <label htmlFor="username" className="block font-bold">
              اسم المستخدم
            </label>
            <input
              id="username"
              type="text"
              required
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mohammed_ali"
              className="bidi-safe mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-lg focus-visible:outline-sky-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              حروف إنجليزية وأرقام و _ فقط، بدون مسافات
            </p>
          </div>

          <div>
            <label htmlFor="countrySearch" className="block font-bold">
              الدولة
            </label>
            <input
              id="countrySearch"
              type="search"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder="ابحث عن دولتك..."
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 focus-visible:outline-sky-200"
            />
            <select
              id="country"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-lg"
            >
              <option value="">اختر دولتك</option>
              {filteredCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block font-bold">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-lg focus-visible:outline-sky-200"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-bold text-sky-300 underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}