import { describe, it, expect } from "vitest";
import {
  resolveFirstAnswer,
  resolveSecondAnswer,
  resolveTimeout,
  hasReachedWinScore,
  computeRatingDelta,
} from "../src/server/match-engine/scoring";

describe("§29 التسجيل الدقيق", () => {
  it("الأول يجيب صحيحًا: +2 والجولة تنتهي", () => {
    const o = resolveFirstAnswer(true);
    expect(o.kind).toBe("FIRST_CORRECT");
    expect(o.firstPoints).toBe(2);
    expect(o.roundEnded).toBe(true);
    expect(o.passToSecond).toBe(false);
  });

  it("الأول يجيب خطأً: -1 والثاني يحصل على فرصة", () => {
    const o = resolveFirstAnswer(false);
    expect(o.kind).toBe("FIRST_INCORRECT");
    expect(o.firstPoints).toBe(-1);
    expect(o.roundEnded).toBe(false);
    expect(o.passToSecond).toBe(true);
  });

  it("الثاني يجيب صحيحًا: +1 والجولة تنتهي", () => {
    const o = resolveSecondAnswer(true);
    expect(o.kind).toBe("SECOND_CORRECT");
    expect(o.secondPoints).toBe(1);
    expect(o.roundEnded).toBe(true);
  });

  it("الثاني يجيب خطأً: لا عقوبة ولا نقاط", () => {
    const o = resolveSecondAnswer(false);
    expect(o.kind).toBe("SECOND_INCORRECT");
    expect(o.secondPoints).toBe(0);
    expect(o.firstPoints).toBe(0);
    expect(o.roundEnded).toBe(true);
  });

  it("انتهاء وقت الأول: لا فرصة للثاني", () => {
    const o = resolveTimeout(true);
    expect(o.kind).toBe("FIRST_TIMEOUT");
    expect(o.firstPoints).toBe(0);
    expect(o.secondPoints).toBe(0);
    expect(o.passToSecond).toBe(false);
  });

  it("انتهاء وقت الثاني: لا عقوبة", () => {
    const o = resolveTimeout(false);
    expect(o.kind).toBe("SECOND_TIMEOUT");
    expect(o.secondPoints).toBe(0);
    expect(o.roundEnded).toBe(true);
  });

  it("§34 الفوز عند 20 نقطة بالضبط", () => {
    expect(hasReachedWinScore(19)).toBe(false);
    expect(hasReachedWinScore(20)).toBe(true);
    expect(hasReachedWinScore(21)).toBe(true);
  });

  it("§36 التقييم: الفوز يرفع والخسارة تخفض", () => {
    expect(computeRatingDelta(1000, 1000, true)).toBe(16);
    expect(computeRatingDelta(1000, 1000, false)).toBe(-16);
  });
});
