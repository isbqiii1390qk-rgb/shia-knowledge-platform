import { describe, it, expect } from "vitest";
import {
  dedupeRequests,
  isAnswerWithinDeadline,
} from "../src/server/match-engine/buzzer";

describe("§50 إزالة الطلبات المكررة", () => {
  it("نفس requestId من نفس اللاعب يُقبل مرة واحدة", () => {
    const entries = [
      { playerId: "p1", requestId: "r1", receivedAtServer: 100 },
      { playerId: "p1", requestId: "r1", receivedAtServer: 105 }, // إعادة محاولة شبكة
      { playerId: "p2", requestId: "r2", receivedAtServer: 103 },
    ];
    const deduped = dedupeRequests(entries);
    expect(deduped).toHaveLength(2);
    expect(deduped[0].playerId).toBe("p1");
    expect(deduped[1].playerId).toBe("p2");
  });

  it("لاعبان مختلفان بنفس requestId يُقبلان كليهما", () => {
    const entries = [
      { playerId: "p1", requestId: "same", receivedAtServer: 100 },
      { playerId: "p2", requestId: "same", receivedAtServer: 101 },
    ];
    expect(dedupeRequests(entries)).toHaveLength(2);
  });
});

describe("§28 مواعيد الإجابة", () => {
  it("الإجابة قبل الموعد مقبولة", () => {
    expect(isAnswerWithinDeadline(999, 1000)).toBe(true);
  });

  it("الإجابة بعد الموعد مرفوضة", () => {
    expect(isAnswerWithinDeadline(1001, 1000)).toBe(false);
  });
});
