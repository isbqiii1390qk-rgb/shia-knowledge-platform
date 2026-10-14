// §22-§23 اختيار الأسئلة — عشوائي، بدون تكرار داخل المباراة نفسها أبدًا
// فقط الأسئلة VERIFIED أو PUBLISHED تدخل اللعبة
// §24 الجواب الصحيح يُخزن بمعرّف داخلي مستقر — أبدًا لا يعتمد على أ/ب/ج/د

import { createHash, randomUUID } from "crypto";

export interface SelectableQuestion {
  id: string;
  verificationStatus: "VERIFIED" | "PUBLISHED";
}

export interface ShuffleResult<T> {
  items: T[];
}

/** خلط فيشر-ييتس — ترتيب الخيارات عشوائي لكل مباراة */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    if (i !== j) [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomInt(maxExclusive: number): number {
  // crypto-based unbiased random in [0, maxExclusive)
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  let v = 0;
  do {
    v = cryptoRandom();
  } while (v >= limit);
  return v % maxExclusive;
}

function cryptoRandom(): number {
  const buf = Buffer.alloc(4);
  // NOTE: in Node runtime this uses crypto.randomFillSync under the hood
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const c = require("crypto");
  c.randomFillSync(buf);
  return buf.readUInt32BE(0);
}

/** §56 بصمة السؤال للكشف عن التكرار — نص مُطبّع ثم هاش */
export function computeQuestionHash(normalizedText: string): string {
  const normalized = normalizeArabic(normalizedText);
  return createHash("sha256").update(normalized).digest("hex");
}

/** تطبيع النص العربي: إزالة التشكيل والتطويل وتوحيد الألف والهمزات */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // تشكيل + تطويل
    .replace(/[\u0622\u0623\u0625]/g, "\u0627") // آ أ إ → ا
    .replace(/[\u0649]/g, "\u064A")             // ى → ي
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * §23 اختيار سؤال عشوائي من الأسئلة المؤهلة، مع استبعاد ما استُخدم في المباراة.
 * إن لم يبقَ ما يكفي، يعالج الحالة بأمان (يرجع null — لا تكرار إجباري أبدًا).
 */
export function selectRandomQuestion(
  eligible: SelectableQuestion[],
  usedInThisMatch: Set<string>
): SelectableQuestion | null {
  const pool = eligible.filter((q) => !usedInThisMatch.has(q.id));
  if (pool.length === 0) return null;
  return pool[randomInt(pool.length)];
}

/**
 * §22 ترتيب الخيارات عشوائيًا مع الحفاظ على المعرّف الداخلي المستقر.
 * الخريطة الراجعة تسمح للخادم بالتحقق من صحة الجواب بالمعرّف، لا بالحرف.
 */
export function shuffleChoicesWithStableIds<T extends { id: string }>(choices: T[]): ShuffleResult<T> {
  return { items: shuffle(choices) };
}

/** §11 رمز دعوة آمن تشفيريًا */
export function generateInvitationToken(): string {
  return randomUUID().replace(/-/g, "");
}

/** §50 معرّف طلب فريد للأوامر الحساسة */
export function newRequestId(): string {
  return randomUUID();
}
