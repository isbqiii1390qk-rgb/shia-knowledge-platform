// مخططات Zod — التحقق من صحة كل مدخلات العميل على الخادم (§52)
// لا يُقبل أي مدخل قبل اجتياز هذه المخططات

import { z } from "zod";

// §7 اسم المستخدم: حروف إنجليزية وأرقام وشرطة سفلية فقط، بلا مسافات
export const usernameSchema = z
  .string()
  .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
  .max(30, "اسم المستخدم طويل جدًا")
  .regex(/^[a-zA-Z0-9_]+$/, "يسمح فقط بحروف إنجليزية وأرقام وشرطة سفلية _");

// اسم العرض: عربي أو إنجليزي
export const displayNameSchema = z
  .string()
  .min(2, "الاسم قصير جدًا")
  .max(50, "الاسم طويل جدًا")
  .regex(/^[\u0600-\u06FF\u0750-\u077FA-Za-z0-9 .'_-]+$/, "الاسم يحتوي أحرفًا غير مسموحة");

export const countrySchema = z
  .string()
  .length(2, "رمز الدولة غير صالح");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جدًا");

export const registerSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  country: countrySchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export const acceptRulesSchema = z.object({
  accepted: z.literal(true, {
    errorMap: () => ({ message: "يجب الإقرار بالقواعد قبل الدخول" }),
  }),
});

// §50 كل أمر حساس يحمل requestId فريد
export const requestHeaderSchema = z.object({
  requestId: z.string().uuid(),
});

export const buzzerPressSchema = requestHeaderSchema;

export const answerSubmitSchema = requestHeaderSchema.extend({
  choiceId: z.string().min(1, "اختر إجابة"),
});

export const readyNextSchema = requestHeaderSchema;

export const invitationJoinSchema = z.object({
  token: z.string().min(20, "رابط الدعوة غير صالح").max(128),
});

export const createInvitationSchema = z.object({
  requestId: z.string().uuid(),
});

export const reportSchema = z.object({
  reason: z.enum([
    "QUESTION_INACCURATE",
    "SOURCE_MISMATCH",
    "AMBIGUOUS_QUESTION",
    "OFFENSIVE_BEHAVIOR",
    "CHEATING",
    "OTHER",
  ]),
  details: z.string().min(5).max(1000).optional(),
  questionId: z.string().optional(),
  targetUserId: z.string().optional(),
});

// §21 لوحة الإدارة — مخططات المحتوى
export const bookSchema = z.object({
  titleAr: z.string().min(2).max(200),
  titleEn: z.string().max(200).optional(),
  authorAr: z.string().min(2).max(200),
});

export const editionSchema = z.object({
  bookId: z.string().min(1),
  titleAr: z.string().min(2).max(200),
  publisher: z.string().max(200).optional(),
  editionYear: z.number().int().min(700).max(2100).optional(),
  citation: z.string().max(500).optional(),
});

export const chapterSchema = z.object({
  volumeId: z.string().min(1),
  number: z.number().int().min(1),
  titleAr: z.string().min(2).max(300),
});

export const narrationSchema = z.object({
  chapterId: z.string().min(1),
  editionId: z.string().min(1),
  bookId: z.string().min(1),
  arabicText: z.string().min(10, "الرواية مطلوبة").max(10000),
  hadithNumber: z.number().int().positive().optional(),
  pageNumber: z.number().int().positive().optional(),
  narrator: z.string().max(300).optional(),
});

export const questionSchema = z.object({
  narrationId: z.string().min(1),
  questionText: z.string().min(10, "نص السؤال مطلوب").max(1000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  topic: z.string().max(100).optional(),
  choices: z
    .array(z.object({ content: z.string().min(1).max(500), isCorrect: z.boolean() }))
    .length(4, "يجب أن يكون هناك أربعة خيارات بالضبط"),
}).refine((q) => q.choices.filter((c) => c.isCorrect).length === 1, {
  message: "يجب أن يكون هناك جواب صحيح واحد بالضبط",
});
