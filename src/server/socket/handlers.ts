// معالجات أحداث المباراة — منطق الخادم الحاكم فقط
// الجرس والإجابة والجاهزية والنقاط: كل الحسم هنا، العميل يعرض فقط

import type { Server, Socket } from "socket.io";
import { db } from "@/server/db";
import { MatchConfig, canTransition } from "../match-engine/state-machine";
import {
  resolveFirstAnswer,
  resolveSecondAnswer,
  resolveTimeout,
  hasReachedWinScore,
  computeRatingDelta,
} from "../match-engine/scoring";
import { dedupeRequests, isAnswerWithinDeadline } from "../match-engine/buzzer";
import { selectRandomQuestion, shuffle } from "../match-engine/question-selection";

interface AuthedSocket extends Socket {
  data: { userId: string; username: string };
}

// ---- انضمام إلى غرفة المباراة + استعادة الحالة عند إعادة الاتصال (§51) ----
export async function handleJoinMatch(io: Server, socket: AuthedSocket, payload: unknown) {
  const matchId = typeof payload === "string" ? payload : (payload as { matchId?: string })?.matchId;
  if (!matchId || typeof matchId !== "string") return;

  const mp = await db.matchPlayer.findFirst({
    where: { matchId, userId: socket.data.userId },
  });
  if (!mp) {
    socket.emit("match:error", { message: "أنت لست مشاركًا في هذه المباراة" });
    return;
  }

  await socket.join(`match:${matchId}`);
  await db.matchPlayer.update({
    where: { id: mp.id },
    data: { connected: true, lastSeenAt: new Date() },
  });
  await db.matchEvent.create({
    data: { matchId, type: "PLAYER_RECONNECTED", playerId: mp.id },
  });

  socket.emit("match:joined", { matchId, playerId: mp.id });
}

// ---- الجرس (§26) ----
export async function handleBuzzerPress(io: Server, socket: AuthedSocket, payload: unknown) {
  try {
    const { matchId, requestId } = (payload ?? {}) as { matchId?: string; requestId?: string };
    if (!matchId || !requestId) return;

    const mp = await db.matchPlayer.findFirst({
      where: { matchId, userId: socket.data.userId },
    });
    if (!mp) return;

    // §50 idempotency — نفس الطلب يُعالج مرة واحدة فقط
    const key = `buzz:${matchId}:${mp.id}:${requestId}`;
    try {
      await db.processedRequest.create({ data: { requestKey: key } });
    } catch {
      return; // طلب مكرر — تجاهل بهدوء
    }

    const match = await db.match.findUnique({ where: { id: matchId } });
    if (!match || match.state !== "QUESTION_ACTIVE") return;

    const usedQuestions = await db.matchQuestion.findMany({
      where: { matchId },
      select: { questionId: true },
    });
    void usedQuestions;

    // أول ضغطة تصل للخادم تفوز — لا توقيت من العميل أبدًا
    await db.$transaction(async (tx) => {
      const fresh = await tx.match.findUnique({ where: { id: matchId } });
      if (!fresh || fresh.state !== "QUESTION_ACTIVE") return;

      await tx.match.update({
        where: { id: matchId },
        data: { state: "FIRST_PLAYER_ANSWERING" },
      });
      await tx.matchPlayer.update({
        where: { id: mp.id },
        data: { answeringSince: new Date() },
      });
      await tx.matchEvent.create({
        data: {
          matchId,
          type: "BUZZER_WON",
          playerId: mp.id,
          payload: { requestId },
        },
      });
    });

    const deadline = Date.now() + MatchConfig.ANSWER_SECONDS * 1000;
    io.to(`match:${matchId}`).emit("match:buzzer-won", {
      winnerPlayerId: mp.id,
      answeringPlayerId: mp.id,
      deadlineAt: deadline,
    });
  } catch (e) {
    console.error("buzzer error:", e);
  }
}

// ---- تقديم الإجابة (§27-§29) ----
export async function handleAnswerSubmit(io: Server, socket: AuthedSocket, payload: unknown) {
  try {
    const { matchId, choiceId, requestId } = (payload ?? {}) as {
      matchId?: string; choiceId?: string; requestId?: string;
    };
    if (!matchId || !choiceId || !requestId) return;

    const mp = await db.matchPlayer.findFirst({
      where: { matchId, userId: socket.data.userId },
    });
    if (!mp) return;

    const key = `answer:${matchId}:${mp.id}:${requestId}`;
    try {
      await db.processedRequest.create({ data: { requestKey: key } });
    } catch {
      return; // مكرر
    }

    const match = await db.match.findUnique({ where: { id: matchId } });
    if (!match) return;
    if (match.state !== "FIRST_PLAYER_ANSWERING" && match.state !== "SECOND_PLAYER_ANSWERING") return;

    // §28 الخادم يرفض الإجابات المتأخرة
    const answeredAt = Date.now();
    const answeringSince = mp.answeringSince?.getTime() ?? answeredAt;
    const deadline = answeringSince + MatchConfig.ANSWER_SECONDS * 1000;
    if (!isAnswerWithinDeadline(answeredAt, deadline)) {
      socket.emit("match:answer-rejected", { reason: "EXPIRED" });
      return;
    }

    // السؤال الحالي
    const current = await db.matchQuestion.findFirst({
      where: { matchId },
      orderBy: { sequence: "desc" },
      include: { question: { include: { choices: true, narration: true, book: true, edition: true } } },
    });
    if (!current) return;

    const choice = current.question.choices.find((c) => c.id === choiceId);
    if (!choice) {
      socket.emit("match:answer-rejected", { reason: "INVALID_CHOICE" });
      return;
    }

    const isFirstPhase = match.state === "FIRST_PLAYER_ANSWERING";
    const outcome = isFirstPhase
      ? resolveFirstAnswer(choice.isCorrect)
      : resolveSecondAnswer(choice.isCorrect);

    // نقاط اللاعبين
    const players = await db.matchPlayer.findMany({ where: { matchId } });
    const answeringPlayer = players.find((p) => p.id === mp.id)!;
    const otherPlayer = players.find((p) => p.id !== mp.id)!;

    const applyPoints = async (
      tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
      playerId: string,
      points: number
    ) => {
      const p = players.find((x) => x.id === playerId)!;
      await tx.matchPlayer.update({
        where: { id: playerId },
        data: {
          rawScore: { increment: points },
          score: Math.max(0, p.rawScore + points), // §30
          answeredCount: { increment: 1 },
          correctCount: points > 0 ? { increment: 1 } : undefined,
        },
      });
    };

    await db.$transaction(async (tx) => {
      await tx.answerEvent.create({
        data: {
          matchId,
          matchQuestionId: current.id,
          matchPlayerId: mp.id,
          choiceId,
          isCorrect: choice.isCorrect,
          points: Math.max(0, outcome.kind === "FIRST_CORRECT" ? 2 : outcome.kind === "SECOND_CORRECT" ? 1 : 0),
          rawPoints: isFirstPhase ? outcome.firstPoints : outcome.secondPoints,
        },
      });

      if (isFirstPhase) {
        await applyPoints(tx, mp.id, outcome.firstPoints);
      } else {
        await applyPoints(tx, mp.id, outcome.secondPoints);
      }

      await tx.matchEvent.create({
        data: {
          matchId,
          type: choice.isCorrect ? "ANSWER_CORRECT" : "ANSWER_INCORRECT",
          playerId: mp.id,
          payload: { kind: outcome.kind },
        },
      });

      if (outcome.passToSecond && otherPlayer) {
        await tx.match.update({
          where: { id: matchId },
          data: { state: "SECOND_PLAYER_ANSWERING" },
        });
        await tx.matchPlayer.update({
          where: { id: otherPlayer.id },
          data: { answeringSince: new Date() },
        });
        await tx.matchEvent.create({
          data: { matchId, type: "SECOND_PLAYER_ALLOWED", playerId: otherPlayer.id },
        });
      } else {
        await tx.match.update({
          where: { id: matchId },
          data: { state: "SOURCE_REVIEW" },
        });
      }
    });

    if (outcome.passToSecond && otherPlayer) {
      io.to(`match:${matchId}`).emit("match:phase", {
        state: "SECOND_PLAYER_ANSWERING",
        answeringPlayerId: otherPlayer.id,
        deadlineAt: Date.now() + MatchConfig.ANSWER_SECONDS * 1000,
      });
    } else {
      // §31 عرض الرواية الأصلية
      io.to(`match:${matchId}`).emit("match:phase", {
        state: "SOURCE_REVIEW",
        source: {
          narrationText: current.question.narration.arabicText,
          bookTitle: current.question.book.titleAr,
          editionTitle: current.question.edition.titleAr,
          volumeNumber: current.question.narration.chapter.volumeId ? null : null,
          hadithNumber: current.question.narration.hadithNumber,
          pageNumber: current.question.narration.pageNumber,
          chapterTitle: current.question.narration.chapter.titleAr,
        },
      });
    }
    void answeringPlayer;
  } catch (e) {
    console.error("answer error:", e);
  }
}

// ---- جاهز للسؤال التالي (§32-§33) ----
export async function handleReadyNext(io: Server, socket: AuthedSocket, payload: unknown) {
  try {
    const { matchId, requestId } = (payload ?? {}) as { matchId?: string; requestId?: string };
    if (!matchId || !requestId) return;

    const mp = await db.matchPlayer.findFirst({
      where: { matchId, userId: socket.data.userId },
    });
    if (!mp) return;

    const key = `ready:${matchId}:${mp.id}`;
    try {
      await db.processedRequest.create({ data: { requestKey: key } });
    } catch {
      return;
    }

    await db.$transaction(async (tx) => {
      const fresh = await tx.match.findUnique({ where: { id: matchId } });
      if (!fresh || fresh.state !== "SOURCE_REVIEW" && fresh.state !== "WAITING_FOR_BOTH_READY") return;

      await tx.matchPlayer.update({
        where: { id: mp.id },
        data: { ready: true },
      });
      await tx.matchEvent.create({
        data: { matchId, type: "PLAYER_READY", playerId: mp.id },
      });

      const all = await tx.matchPlayer.findMany({ where: { matchId } });
      const bothReady = all.every((p) => p.ready);

      if (bothReady && canTransition(fresh.state, "WAITING_FOR_BOTH_READY")) {
        await tx.match.update({
          where: { id: matchId },
          data: { state: "WAITING_FOR_BOTH_READY" },
        });
      }

      // إشعار اللاعب الآخر فورًا (§33)
      io.to(`match:${matchId}`).emit("match:player-ready", {
        readyPlayerId: mp.id,
      });
    });
  } catch (e) {
    console.error("ready-next error:", e);
  }
}

// ---- فصل الاتصال (§51) ----
export async function handleDisconnect(io: Server, socket: AuthedSocket) {
  try {
    const rooms = Array.from(socket.rooms).filter((r) => r.startsWith("match:"));
    for (const room of rooms) {
      const matchId = room.slice("match:".length);
      const mp = await db.matchPlayer.findFirst({
        where: { matchId, userId: socket.data.userId },
      });
      if (!mp) continue;
      await db.matchPlayer.update({
        where: { id: mp.id },
        data: { connected: false },
      });
      await db.matchEvent.create({
        data: { matchId, type: "PLAYER_DISCONNECTED", playerId: mp.id },
      });
      socket.to(room).emit("match:opponent-disconnected", { playerId: mp.id });
    }
  } catch (e) {
    console.error("disconnect error:", e);
  }
}
