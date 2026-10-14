# المعرّف: منصة المعرفة العقائدية الشيعية

> معرفتك العقائدية الشيعية أساس نجاحك

منصة معرفية تنافسية تجمع بين التعلم والمراجعة والتحدي المحترم من خلال أسئلة مستندة إلى مصادر شيعية موثقة.

**المعرفة أولاً، والمنافسة وسيلة للتعلّم.**

## المعمارية

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS — لوحة الألوان: `#82CAFA` `#B0E2FF` `#FFFFFF` `#000000`
- PostgreSQL + Prisma ORM
- Socket.IO للمباريات في الزمن الحقيقي (خادم حاكم — Server-Authoritative)
- Zod للتحقق من المدخلات على الخادم
- مصادقة JWT عبر HttpOnly Cookie + bcryptjs
- دعم PWA

## التشغيل المحلي

```bash
npm install
cp .env.example .env        # ثم املأ القيم
npx prisma migrate dev
npm run db:seed
npm run dev
```

## هيكل المشروع

```
src/
  app/            # صفحات Next.js (RTL عربي أولًا)
  components/     # مكونات React
  server/
    auth/         # الجلسات والصلاحيات
    db.ts         # عميل Prisma
    match-engine/ # محرك المباريات (آلة الحالات، الجرس، التسجيل)
    validation/   # مخططات Zod
    socket/       # خادم Socket.IO
prisma/
  schema.prisma   # مخطط قاعدة البيانات الكامل
  seed.ts         # البيانات الأولية (الكافي وبصائر الدرجات)
```

## سلامة المصادر — قاعدة أساسية

- لا تُخترع روايات أو أرقام صفحات أو مراجع أبدًا.
- الأسئلة مشتقة من روايات موثقة، والرواية الأصلية تُعرض بعد الإجابة.
- كل سؤال يمر بدورة: DRAFT → UNDER_REVIEW → VERIFIED → PUBLISHED.
- المستوى التنافسي ليس صفة دينية وليس مؤهلًا شرعيًا.
