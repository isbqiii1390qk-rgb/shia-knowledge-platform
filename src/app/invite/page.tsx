"use client";

import { useEffect, useRef, useState } from "react";

// صفحة إنشاء رابط الدعوة — نسخ الرابط وعرض الصلاحية (§11)

export default function InvitePage() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestedRef = useRef(false);

  async function createInvite() {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ غير متوقع. حاول مرة أخرى.");
        requestedRef.current = false;
        return;
      }
      setInviteUrl(data.inviteUrl);
      setExpiresAt(data.expiresAt);
    } catch {
      setError("تعذر الاتصال بالخادم. تحقق من اتصالك.");
      requestedRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("تعذر نسخ الرابط — انسخه يدويًا.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-extrabold">إنشاء رابط دعوة</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          شارك الرابط مع صديقك لخوض جولة معرفية خاصة. الرابط صالح لمرة واحدة
          ولمدة محدودة، ولا يمكن استخدامه بعد بدء المباراة.
        </p>

        {!inviteUrl && !loading && !error && (
          <button onClick={createInvite} className="btn-primary mt-6 w-full">
            إنشاء الرابط
          </button>
        )}

        {loading && (
          <p className="mt-6 text-center font-bold text-gray-600">جارٍ الإنشاء...</p>
        )}

        {inviteUrl && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-bold text-gray-600">رابط الدعوة</p>
              <p className="bidi-safe mt-2 break-all font-bold" dir="ltr">
                {inviteUrl}
              </p>
            </div>
            {expiresAt && (
              <p className="text-xs text-gray-500">
                ينتهي في: {new Date(expiresAt).toLocaleString("ar")}
              </p>
            )}
            <button onClick={copyLink} className="btn-primary w-full">
              {copied ? "تم النسخ ✓" : "نسخ الرابط"}
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}