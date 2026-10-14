"use client";

// عميل المباراة — يعرض حالة الخادم فقط؛ لا يقرر شيئًا بنفسه (§12-§13)
// الاتصال عبر Socket.IO، وإعادة الاتصال تستعيد الحالة من الخادم (§51)

import { useEffect, useRef, useState } from "react";

interface MatchStateDto {
  state: string;
  questionText?: string;
  choices?: { id: string; label: string; content: string }[];
  answeringPlayerId?: string;
  deadlineAt?: number;
  source?: {
    narrationText: string;
    bookTitle: string;
    editionTitle: string;
    hadithNumber?: number | null;
    pageNumber?: number | null;
    chapterTitle: string;
  };
  scores?: { [playerId: string]: number };
  winnerPlayerId?: string;
}

export default function MatchClient({
  matchId,
  myPlayerId,
  myScore,
  opponentName,
  opponentScore,
}: {
  matchId: string;
  myPlayerId: string;
  myScore: number;
  opponentName: string;
  opponentScore: number;
}) {
  const [connected, setConnected] = useState(false);
  const [matchState, setMatchState] = useState<MatchStateDto | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [opponentReady, setOpponentReady] = useState(false);
  const [iAmReady, setIAmReady] = useState(false);
  const socketRef = useRef<ReturnType<typeof import("socket.io-client").io> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { io } = await import("socket.io-client");
      const socket = io({
        path: "/api/socketio",
        withCredentials: true,
      });
      if (cancelled) {
        socket.close();
        return;
      }
      socketRef.current = socket;

      socket.on("connect", () => {
        setConnected(true);
        socket.emit("match:join", { matchId });
      });
      socket.on("disconnect", () => setConnected(false));

      socket.on("match:state", (s: MatchStateDto) => setMatchState(s));
      socket.on("match:buzzer-won", (s) =>
        setMatchState((prev) => ({
          ...(prev ?? { state: "FIRST_PLAYER_ANSWERING" }),
          state: "FIRST_PLAYER_ANSWERING",
          answeringPlayerId: s.answeringPlayerId,
          deadlineAt: s.deadlineAt,
        }))
      );
      socket.on("match:phase", (s) => setMatchState((prev) => ({ ...prev, ...s })));
      socket.on("match:player-ready", (s) => {
        if (s.readyPlayerId !== myPlayerId) setOpponentReady(true);
      });
      socket.on("match:opponent-disconnected", () => setConnected(false));

      // مؤقت العرض — يعرض فقط؛ الخادم يحسم الموعد النهائي
      if (matchState?.deadlineAt) {
        const t = setInterval(() => {
          setRemaining(Math.max(0, Math.ceil((matchState.deadlineAt! - Date.now()) / 1000)));
        }, 250);
        return () => clearInterval(t);
      }
    })();

    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const isMyTurn = matchState?.answeringPlayerId === myPlayerId;
  const state = matchState?.state ?? "CONNECTING";

  function pressBuzzer() {
    socketRef.current?.emit("match:buzzer", {
      matchId,
      requestId: crypto.randomUUID(),
    });
  }

  function submitAnswer(choiceId: string) {
    socketRef.current?.emit("match:answer", {
      matchId,
      choiceId,
      requestId: crypto.randomUUID(),
    });
  }

  function readyNext() {
    if (iAmReady) return;
    setIAmReady(true);
    socketRef.current?.emit("match:ready-next", {
      matchId,
      requestId: crypto.randomUUID(),
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      {/* النقاط */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-card">
        <div className="text-center">
          <div className="text-xs font-bold text-gray-500">أنت</div>
          <div className="text-2xl font-extrabold text-sky-300">{myScore}</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-gray-500">{opponentName}</div>
          <div className="text-2xl font-extrabold text-sky-300">{opponentScore}</div>
        </div>
      </div>

      {!connected && (
        <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-center font-bold text-gray-700">
          جاري انتظار اتصال الطرف الآخر...
        </p>
      )}

      {/* المؤقت */}
      {remaining !== null && state.includes("ANSWERING") && (
        <div
          role="timer"
          aria-label={`الوقت المتبقي ${remaining} ثانية`}
          className={`mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold ${
            remaining <= 5 ? "bg-sky-100 text-ink" : "bg-white text-sky-300 shadow-card"
          }`}
        >
          {remaining}
        </div>
      )}

      {/* السؤال */}
      {matchState?.questionText && (
        <div className="card mt-4">
          <p className="text-lg font-bold leading-loose">{matchState.questionText}</p>
        </div>
      )}

      {/* الجرس */}
      {state === "QUESTION_ACTIVE" && (
        <button onClick={pressBuzzer} className="btn-primary mt-auto w-full py-6 text-2xl">
          أجيب
        </button>
      )}

      {/* الإجابة */}
      {(state === "FIRST_PLAYER_ANSWERING" || state === "SECOND_PLAYER_ANSWERING") && (
        <div className="mt-4 space-y-3">
          <p className="text-center font-bold">
            {isMyTurn ? "أنت تجيب الآن" : "الطرف الآخر يجيب الآن"}
          </p>
          {isMyTurn &&
            matchState?.choices?.map((c) => (
              <button
                key={c.id}
                onClick={() => submitAnswer(c.id)}
                className="min-h-[56px] w-full rounded-xl border border-sky-100 bg-white p-4 text-right text-lg font-bold shadow-soft hover:bg-sky-50"
              >
                <span className="ml-2 font-extrabold text-sky-300">{c.label}</span>
                {c.content}
              </button>
            ))}
        </div>
      )}

      {/* مراجعة المصدر */}
      {state === "SOURCE_REVIEW" && matchState?.source && (
        <div className="card mt-4">
          <h2 className="text-lg font-extrabold">الرواية الأصلية</h2>
          <p className="mt-3 leading-loose">{matchState.source.narrationText}</p>
          <dl className="mt-4 space-y-2 text-sm text-gray-700">
            <div><dt className="inline font-bold">المصدر: </dt><dd className="inline">{matchState.source.bookTitle}</dd></div>
            <div><dt className="inline font-bold">الطبعة: </dt><dd className="inline">{matchState.source.editionTitle}</dd></div>
            <div><dt className="inline font-bold">الباب: </dt><dd className="inline">{matchState.source.chapterTitle}</dd></div>
            {matchState.source.pageNumber != null && (
              <div><dt className="inline font-bold">الصفحة: </dt><dd className="inline">{matchState.source.pageNumber}</dd></div>
            )}
            {matchState.source.hadithNumber != null && (
              <div><dt className="inline font-bold">رقم الرواية: </dt><dd className="inline">{matchState.source.hadithNumber}</dd></div>
            )}
          </dl>
          <button onClick={readyNext} disabled={iAmReady} className="btn-primary mt-6 w-full">
            {iAmReady ? "أنت جاهز ✓" : "السؤال التالي"}
          </button>
          {opponentReady && (
            <p className="mt-3 text-center text-sm font-bold text-sky-300">
              الطرف الآخر جاهز للسؤال التالي ✓
            </p>
          )}
          {!opponentReady && iAmReady && (
            <p className="mt-3 text-center text-sm text-gray-600">بانتظار الطرف الآخر...</p>
          )}
        </div>
      )}
    </main>
  );
}