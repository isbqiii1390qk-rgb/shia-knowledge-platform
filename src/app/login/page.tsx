"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ غير متوقع. حاول مرة أخرى.");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من اتصالك.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-extrabold">تسجيل الدخول</h1>
        <p className="mt-2 text-sm text-gray-600">
          المعرفة أولاً، والمنافسة وسيلة للتعلّم.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
              className="bidi-safe mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-lg focus-visible:outline-sky-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-bold">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              required
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
            {loading ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          لا تملك حسابًا؟{" "}
          <Link href="/register" className="font-bold text-sky-300 underline">
            أنشئ حسابًا جديدًا
          </Link>
        </p>
      </div>
    </main>
  );
}