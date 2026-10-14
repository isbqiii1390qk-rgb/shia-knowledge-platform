"use client";

// الإعدادات — الصوت، تقليل الحركة، اللغة (§62)
import { useState } from "react";

export default function SettingsPage() {
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // التفضيلات تُحفظ محليًا الآن؛ حفظها للخادم يتطلب جلسة مسجلة
  function toggleSound(v: boolean) {
    setSound(v);
    if (typeof window !== "undefined") localStorage.setItem("sound", JSON.stringify(v));
  }
  function toggleMotion(v: boolean) {
    setReducedMotion(v);
    if (typeof window !== "undefined") localStorage.setItem("reducedMotion", JSON.stringify(v));
  }
  function toggleNotifications(v: boolean) {
    setNotifications(v);
    if (typeof window !== "undefined") localStorage.setItem("notifications", JSON.stringify(v));
  }

  const row =
    "flex items-center justify-between rounded-xl bg-sky-50 px-4 py-4";

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-3xl font-extrabold">الإعدادات</h1>

      <div className="mt-8 space-y-4">
        <div className={row}>
          <label htmlFor="sound" className="font-bold">🔊 الصوت</label>
          <input
            id="sound"
            type="checkbox"
            checked={sound}
            onChange={(e) => toggleSound(e.target.checked)}
            className="h-6 w-6"
          />
        </div>
        <div className={row}>
          <label htmlFor="motion" className="font-bold">تقليل الحركة</label>
          <input
            id="motion"
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => toggleMotion(e.target.checked)}
            className="h-6 w-6"
          />
        </div>
        <div className={row}>
          <label htmlFor="notifications" className="font-bold">الإشعارات</label>
          <input
            id="notifications"
            type="checkbox"
            checked={notifications}
            onChange={(e) => toggleNotifications(e.target.checked)}
            className="h-6 w-6"
          />
        </div>
        <div className={row}>
          <span className="font-bold">اللغة</span>
          <span className="text-gray-600">العربية (افتراضي)</span>
        </div>
      </div>

      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          window.location.href = "/";
        }}
        className="btn-secondary mt-10 w-full"
      >
        تسجيل الخروج
      </button>
    </main>
  );
}