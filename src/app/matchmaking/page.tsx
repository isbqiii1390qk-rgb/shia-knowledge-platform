"use client";

// صفحة البحث عن لاعب — matchmaking حقيقي عبر الخادم (§10)
// لا خصم مزيف — بانتظار لاعب حقيقي آخر فقط.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchmakingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"SEARCHING" | "FOUND" | "ERROR">("SEARCHING");
  const [opponent, setOpponent] = useState<{
    displayName: string;
    username: string;
    country: string;
    level: number;
    rating: number;
    matchId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function joinQueue() {
      try {
        const res = await fetch("/api/matchmaking/join", { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "تعذر بدء البحث");
        }
        // استطلاع حالة البحث من الخادم
        pollRef.current = setInterval(async () => {
          try {
            const s = await fetch("/api/matchmaking/status");
            const data = await s.json();
            if (data.status === "FOUND" && data.matchId) {
              setOpponent(data.opponent);
              setStatus("FOUND");
              if (pollRef.current) clearInterval(pollRef.current);
              // الانتقال لغرفة الانتظار ثم المباراة
              setTimeout(() => router.push(`/match/${data.matchId}`), 1500);
            }
          } catch {
            // استمر في المحاولة — أخطاء الشبكة مؤقتة
          }
        }, 2000);
      } catch (e) {
        setStatus("ERROR");
        setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
      }
    }
    void joinQueue();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router]);

  async function cancelSearch() {
    if (pollRef.current) clearInterval(pollRef.current);
    await fetch("/api/matchmaking/cancel", { method: "POST" }).catch(() => {});
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="card w-full text-center">
        {status === "SEARCHING" && (
          <>
            <h1 className="text-xl font-extrabold">جاري البحث عن لاعب...</h1>
            <p className="mt-4 text-gray-600">
              بانتظار لاعب حقيقي آخر. لا خصوم وهميين في هذه المنصة.
            </p>
            <div
              role="status"
              aria-label="جارٍ البحث"
              className="mx-auto mt-6 h-3 w-40 overflow-hidden rounded-full bg-sky-50"
            >
              <div className="h-full w-1/3 animate-[slide_1.5s_ease-in-out_infinite] bg-sky-200" />
            </div>
            <button onClick={cancelSearch} className="btn-secondary mt-8 w-full">
              إلغاء البحث
            </button>
          </>
        )}

        {status === "FOUND" && opponent && (
          <>
            <h1 className="text-xl font-extrabold">تم العثور على لاعب.</h1>
            <div className="mt-6 rounded-2xl bg-sky-50 p-6">
              <p className="text-lg font-extrabold">{opponent.displayName}</p>
              <p className="bidi-safe mt-1 text-sm text-gray-600" dir="auto">
                @{opponent.username}
              </p>
              <p className="mt-1 text-sm text-gray-600">{opponent.country}</p>
              <p className="mt-1 text-sm text-gray-600">
                المستوى {opponent.level} · التقييم {opponent.rating}
              </p>
            </div>
            <p className="mt-6 font-bold text-sky-300">جارٍ الدخول إلى الجولة...</p>
          </>
        )}

        {status === "ERROR" && (
          <>
            <h1 className="text-xl font-extrabold">تعذر بدء البحث</h1>
            <p role="alert" className="mt-4 text-gray-700">
              {error ?? "حدث خطأ غير متوقع. حاول مرة أخرى."}
            </p>
            <button onClick={cancelSearch} className="btn-primary mt-6 w-full">
              العودة للوحة البداية
            </button>
          </>
        )}

        <style jsx>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    </main>
  );
}