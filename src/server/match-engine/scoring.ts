// §29 التسجيل الدقيق — كل النقاط تُحسب على الخادم فقط
// القواعد المطلوبة حرفيًا:
//   الأول يجيب صحيحًا:   الأول +2  | الثاني +0 → تنتهي الجولة
//   الأول يجيب خطأً:      الأول -1  | الثاني يحصل على فرصة
//     الثاني صحيح:        الثاني +1 | الأول يبقى على -1 → تنتهي
//     الثاني خطأ:         لا عقوبة إضافية ولا نقاط → تنتهي
//   انتهاء وقت الأول:     لا نقاط ولا عقوبة والثاني لا يحصل على فرصة → تنتهي
//   انتهاء وقت الثاني:    لا نقاط إضافية ولا عقوبة → تنتهي

export type AnswerOutcome =
  | { kind: "FIRST_CORRECT"; firstPoints: 2; secondPoints: 0; roundEnded: true; passToSecond: false }
  | { kind: "FIRST_INCORRECT"; firstPoints: -1; secondPoints: 0; roundEnded: false; passToSecond: true }
  | { kind: "SECOND_CORRECT"; firstPoints: 0; secondPoints: 1; roundEnded: true; passToSecond: false }
  | { kind: "SECOND_INCORRECT"; firstPoints: 0; secondPoints: 0; roundEnded: true; passToSecond: false }
  | { kind: "FIRST_TIMEOUT"; firstPoints: 0; secondPoints: 0; roundEnded: true; passToSecond: false }
  | { kind: "SECOND_TIMEOUT"; firstPoints: 0; secondPoints: 0; roundEnded: true; passToSecond: false };

export function resolveFirstAnswer(isCorrect: boolean): AnswerOutcome {
  return isCorrect
    ? { kind: "FIRST_CORRECT", firstPoints: 2, secondPoints: 0, roundEnded: true, passToSecond: false }
    : { kind: "FIRST_INCORRECT", firstPoints: -1, secondPoints: 0, roundEnded: false, passToSecond: true };
}

export function resolveSecondAnswer(isCorrect: boolean): AnswerOutcome {
  return isCorrect
    ? { kind: "SECOND_CORRECT", firstPoints: 0, secondPoints: 1, roundEnded: true, passToSecond: false }
    : { kind: "SECOND_CORRECT_PLACEHOLDER", firstPoints: 0, secondPoints: 1, roundEnded: true, passToSecond: false };
}

export function resolveSecondAnswerIncorrect(isCorrect: false): AnswerOutcome {
  return { kind: "SECOND_INCORRECT", firstPoints: 0, secondPoints: 0, roundEnded: true, passToSecond: false };
}

export function resolveTimeout(answeringFirst: boolean): AnswerOutcome {
  return answeringFirst
    ? { kind: "FIRST_TIMEOUT", firstPoints: 0, secondPoints: 0, roundEnded: true, passToSecond: false }
    : { kind: "SECOND_TIMEOUT", firstPoints: 0, secondPoints: 0, roundEnded: true, passToSecond: false };
}

/** §34 هل وصل اللاعب إلى نقاط الفوز؟ */
export function hasReachedWinScore(score: number, winScore = 20): boolean {
  return score >= winScore;
}

/**
 * §36 تقييم تنافسي قابل للضبط (لا يمثل أي صفة دينية).
 * نظام Elo مبسط — الصيغة قابلة للاستبدال في الإعدادات.
 */
export function computeRatingDelta(
  currentRating: number,
  opponentRating: number,
  won: boolean,
  k = 32
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  const actual = won ? 1 : 0;
  return Math.round(k * (actual - expected));
}
