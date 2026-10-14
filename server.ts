// خادم Socket.IO — الوقت الحقيقي للمباريات
// الخادم حاكم: كل قرارات الجرس والوقت والنقاط تصدر هنا فقط (§12-§13)

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { db } from "@/server/db";
import { getSessionPayloadFromCookieHeader } from "@/server/auth/socket-auth";
import { handleJoinMatch, handleBuzzerPress, handleAnswerSubmit, handleReadyNext, handleDisconnect } from "@/server/socket/handlers";

const PORT = Number(process.env.PORT ?? 3000);
const app = next({ dev: process.env.NODE_ENV !== "production" });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    void handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const payload = getSessionPayloadFromCookieHeader(cookieHeader);
    if (!payload) {
      next(new Error("غير مصرح"));
      return;
    }
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    next();
  });

  io.on("connection", (socket: Socket) => {
    socket.on("match:join", (payload) => void handleJoinMatch(io, socket, payload));
    socket.on("match:buzzer", (payload) => void handleBuzzerPress(io, socket, payload));
    socket.on("match:answer", (payload) => void handleAnswerSubmit(io, socket, payload));
    socket.on("match:ready-next", (payload) => void handleReadyNext(io, socket, payload));
    socket.on("disconnect", () => void handleDisconnect(io, socket));
  });

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
