// آلة الحالات المباريات — الخادم هو مصدر الحقيقة الوحيد
// فقط الانتقالات الصحيحة مسموحة؛ العميل لا يستطيع تغيير الحالة أبدًا

export const MatchStates = {
  WAITING_FOR_PLAYER: "WAITING_FOR_PLAYER",
  MATCH_READY: "MATCH_READY",
  QUESTION_ACTIVE: "QUESTION_ACTIVE",
  FIRST_PLAYER_ANSWERING: "FIRST_PLAYER_ANSWERING",
  SECOND_PLAYER_ANSWERING: "SECOND_PLAYER_ANSWERING",
  SOURCE_REVIEW: "SOURCE_REVIEW",
  WAITING_FOR_BOTH_READY: "WAITING_FOR_BOTH_READY",
  MATCH_FINISHED: "MATCH_FINISHED",
  CANCELLED: "CANCELLED",
} as const;

export type MatchState = keyof typeof MatchStates;

/** التوقيتات (بثواني) — قابلة للضبط */
export const MatchConfig = {
  ANSWER_SECONDS: 25,
  WARNING_AT_SECONDS: 5,
  SOURCE_MIN_SECONDS: 20,
  WIN_SCORE: 20,
  DISCONNECT_GRACE_SECONDS: 60,
  INVITATION_TTL_SECONDS: 60 * 60,
  SCORE_FLOOR: true,
} as const;

/** الانتقالات المسموحة فقط — أي انتقال غير موجود هنا مرفوض */
const VALID_TRANSITIONS: Record<MatchState, MatchState[]> = {
  WAITING_FOR_PLAYER: ["MATCH_READY", "CANCELLED"],
  MATCH_READY: ["QUESTION_ACTIVE", "CANCELLED"],
  QUESTION_ACTIVE: ["FIRST_PLAYER_ANSWERING", "SOURCE_REVIEW", "CANCELLED"],
  FIRST_PLAYER_ANSWERING: ["SECOND_PLAYER_ANSWERING", "SOURCE_REVIEW", "MATCH_FINISHED", "CANCELLED"],
  SECOND_PLAYER_ANSWERING: ["SOURCE_REVIEW", "MATCH_FINISHED", "CANCELLED"],
  SOURCE_REVIEW: ["WAITING_FOR_BOTH_READY", "MATCH_FINISHED", "CANCELLED"],
  WAITING_FOR_BOTH_READY: ["QUESTION_ACTIVE", "MATCH_FINISHED", "CANCELLED"],
  MATCH_FINISHED: [],
  CANCELLED: [],
};

export function canTransition(from: MatchState, to: MatchState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(public from: MatchState, public to: MatchState) {
    super(`انتقال غير صالح: ${from} → ${to}`);
    this.name = "InvalidTransitionError";
  }
}

/** حالات لا تُقبل فيها أي أوامر من العميل */
export function isLocked(state: MatchState): boolean {
  return state === "MATCH_FINISHED" || state === "CANCELLED";
}

/** §30 عرض النتيجة بحد أدنى صفر مع الاحتفاظ بالسجل الكامل */
export function displayScore(rawScore: number, floor = MatchConfig.SCORE_FLOOR): number {
  return floor ? Math.max(0, rawScore) : rawScore;
}
