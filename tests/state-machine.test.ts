import { describe, it, expect } from "vitest";
import {
  canTransition,
  isLocked,
  displayScore,
} from "../src/server/match-engine/state-machine";

describe("§14 آلة الحالات — انتقالات صالحة فقط", () => {
  it("المسار القياسي للسؤال", () => {
    expect(canTransition("QUESTION_ACTIVE", "FIRST_PLAYER_ANSWERING")).toBe(true);
    expect(canTransition("FIRST_PLAYER_ANSWERING", "SOURCE_REVIEW")).toBe(true);
    expect(canTransition("SOURCE_REVIEW", "WAITING_FOR_BOTH_READY")).toBe(true);
    expect(canTransition("WAITING_FOR_BOTH_READY", "QUESTION_ACTIVE")).toBe(true);
  });

  it("الانتقالات العشوائية مرفوضة", () => {
    expect(canTransition("QUESTION_ACTIVE", "MATCH_FINISHED")).toBe(false);
    expect(canTransition("WAITING_FOR_PLAYER", "QUESTION_ACTIVE")).toBe(false);
    expect(canTransition("SOURCE_REVIEW", "FIRST_PLAYER_ANSWERING")).toBe(false);
  });

  it("الحالات النهائية مقفلة تمامًا", () => {
    expect(isLocked("MATCH_FINISHED")).toBe(true);
    expect(isLocked("CANCELLED")).toBe(true);
    expect(canTransition("MATCH_FINISHED", "QUESTION_ACTIVE")).toBe(false);
    expect(canTransition("CANCELLED", "MATCH_READY")).toBe(false);
  });

  it("§30 عرض النتيجة بحد أدنى صفر", () => {
    expect(displayScore(-3)).toBe(0);
    expect(displayScore(5)).toBe(5);
    expect(displayScore(-3, false)).toBe(-3);
  });
});
