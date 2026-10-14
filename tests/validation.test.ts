import { describe, it, expect } from "vitest";
import {
  registerSchema,
  usernameSchema,
  displayNameSchema,
  questionSchema,
} from "../src/server/validation/schemas";

describe("§7 التحقق من صحة التسجيل", () => {
  it("يقبل اسم عربي واسم إنجليزي صالحين", () => {
    expect(displayNameSchema.safeParse("محمد علي").success).toBe(true);
    expect(displayNameSchema.safeParse("Mohammed Ali").success).toBe(true);
  });

  it("يقبل اسم مستخدم صالحًا", () => {
    expect(usernameSchema.safeParse("mohammed_ali").success).toBe(true);
    expect(usernameSchema.safeParse("user123").success).toBe(true);
  });

  it("يرفض اسم مستخدم غير صالح: مسافات أو أحرف عربية أو رموز", () => {
    expect(usernameSchema.safeParse("mohammed ali").success).toBe(false);
    expect(usernameSchema.safeParse("محمد").success).toBe(false);
    expect(usernameSchema.safeParse("user-name!").success).toBe(false);
    expect(usernameSchema.safeParse("ab").success).toBe(false);
  });

  it("يتطلب رمز دولة صالحًا", () => {
    const r = registerSchema.safeParse({
      displayName: "محمد علي",
      username: "mohammed_ali",
      country: "SA",
      password: "password123",
    });
    expect(r.success).toBe(true);
  });

  it("يرفض كلمة مرور قصيرة", () => {
    const r = registerSchema.safeParse({
      displayName: "محمد علي",
      username: "mohammed_ali",
      country: "SA",
      password: "123",
    });
    expect(r.success).toBe(false);
  });
});

describe("§55 جودة الأسئلة", () => {
  it("يتطلب أربعة خيارات وجوابًا صحيحًا واحدًا بالضبط", () => {
    const valid = questionSchema.safeParse({
      narrationId: "n1",
      questionText: "سؤال تجريبي عن الرواية الأولى",
      difficulty: "EASY",
      choices: [
        { content: "أ", isCorrect: true },
        { content: "ب", isCorrect: false },
        { content: "ج", isCorrect: false },
        { content: "د", isCorrect: false },
      ],
    });
    expect(valid.success).toBe(true);

    const twoCorrect = questionSchema.safeParse({
      narrationId: "n1",
      questionText: "سؤال تجريبي عن الرواية الأولى",
      difficulty: "EASY",
      choices: [
        { content: "أ", isCorrect: true },
        { content: "ب", isCorrect: true },
        { content: "ج", isCorrect: false },
        { content: "د", isCorrect: false },
      ],
    });
    expect(twoCorrect.success).toBe(false);
  });
});
