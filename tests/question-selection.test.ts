import { describe, it, expect } from "vitest";
import {
  selectRandomQuestion,
  shuffle,
  normalizeArabic,
  computeQuestionHash,
  generateInvitationToken,
} from "../src/server/match-engine/question-selection";

const pool = [
  { id: "q1", verificationStatus: "VERIFIED" as const },
  { id: "q2", verificationStatus: "VERIFIED" as const },
  { id: "q3", verificationStatus: "PUBLISHED" as const },
];

describe("§23 عدم تكرار الأسئلة", () => {
  it("لا يعيد سؤالًا مستخدمًا في نفس المباراة", () => {
    const used = new Set(["q1"]);
    const picks: string[] = [];
    for (let i = 0; i < 50; i++) {
      const q = selectRandomQuestion(pool, used);
      if (q) picks.push(q.id);
    }
    expect(picks).not.toContain("q1");
  });

  it("يرجع null بأمان عند نفاد المجموعة — لا تكرار إجباري", () => {
    const used = new Set(["q1", "q2", "q3"]);
    expect(selectRandomQuestion(pool, used)).toBeNull();
  });
});

describe("§22 العشوائية", () => {
  it("الخلط يحافظ على كل العناصر", () => {
    const result = shuffle([1, 2, 3, 4, 5, 6]);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("ترتيب الخيارات يتغير بين المحاولات (غالبًا)", () => {
    const original = [1, 2, 3, 4];
    let changed = false;
    for (let i = 0; i < 20; i++) {
      if (shuffle(original).join(",") !== original.join(",")) changed = true;
    }
    expect(changed).toBe(true);
  });
});

describe("§56 تطبيع العربي وكشف التكرار", () => {
  it("يوحد الهمزات والتشكيل والمسافات", () => {
    expect(normalizeArabic("إِبْرَاهِيم")).toBe(normalizeArabic("ابراهيم"));
    expect(normalizeArabic("آمن  بالله")).toBe(normalizeArabic("امن بالله"));
  });

  it("نفس السؤال بنصوص مختلفة التشكيل له نفس البصمة", () => {
    expect(computeQuestionHash("مَنْ هُوَ النَّبِيُّ؟")).toBe(
      computeQuestionHash("من هو النبي؟")
    );
  });
});

describe("§11 رموز الدعوة", () => {
  it("رمز فريد وطويل بما يكفي", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});
