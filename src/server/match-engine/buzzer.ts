// §26 تحكيم الجرس — أول ضغطة "أجيب" تصل إلى الخادم تربح الفرصة
// لا نعتمد أبدًا على توقيت المتصفح — الترتيب يُحدد على الخادم فقط

import type { MatchState } from "./state-machine";

export type BuzzerResult =
  | { ok: true; winnerPlayerId: string; transition: Extract<MatchState, "FIRST_PLAYER_ANSWERING" | "SECOND_PLAYER_ANSWERING"> }
  | { ok: false; reason: "LOCKED" | "WRONG_STATE" | "ALREADY_ANSWERING" | "NOT_IN_MATCH" };

export interface BuzzerEntry {
  playerId: string;
  receivedAtServer: number; // server clock only — monotonic ordering
  requestId: string;         // §50 idempotency — duplicate presses ignored
}

/**
 * يُستدعى عند وصول ضغطة جرس إلى الخادم.
 * أول ضغطة صالحة تصل (بتوقيت الخادم) هي الفائزة.
 * الضغطات المتزامنة تُفصل بترتيب الوصول للخادم — العميل لا يقرر شيئًا.
 */
export function arbitrateBuzzer(
  state: MatchState,
  presses: BuzzerEntry[]
): BuzzerResult {
  if (state === "MATCH_FINISHED" || state === "CANCELLED") {
    return { ok: false, reason: "LOCKED" };
  }
  if (state !== "QUESTION_ACTIVE") {
    return { ok: false, reason: "WRONG_STATE" };
  }
  const valid = presses
    .filter((p) => Boolean(p.requestId))
    .sort((a, b) => a.receivedAtServer - b.receivedAtServer);
  if (valid.length === 0) return { ok: false, reason: "NOT_IN_MATCH" };
  const first = valid[0];
  return {
    ok: true,
    winnerPlayerId: first.playerId,
    transition: "FIRST_PLAYER_ANSWERING",
  };
}

/**
 * §50 إزالة الطلبات المكررة — نفس requestId من نفس اللاعب يُقبل مرة واحدة فقط.
 * إعادة المحاولة بسبب الشبكة لن تُكرر الفعل أبدًا.
 */
export function dedupeRequests<T extends { playerId: string; requestId: string }>(
  entries: T[]
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const e of entries) {
    const key = `${e.playerId}:${e.requestId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(e);
    }
  }
  return result;
}

/**
 * §28 التحقق من صلاحية إجابة — الخادم يرفض أي إجابة تصل بعد الموعد النهائي.
 * العميل يعرض المؤقت فقط، لكن الحسم على الخادم.
 */
export function isAnswerWithinDeadline(
  answeredAtServer: number,
  deadlineAtServer: number
): boolean {
  return answeredAtServer <= deadlineAtServer;
}
