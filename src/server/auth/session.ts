// إدارة الجلسات — مصادقة آمنة عبر HttpOnly Cookies (§52)
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/server/db";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-only-secret-change-me"
);

export interface SessionPayload {
  userId: string;
  username: string;
  role: "USER" | "ADMIN";
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as "USER" | "ADMIN",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = cookies();
  const token = store.get("session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** §54 التحقق من صلاحيات الإدارة — دائمًا من قاعدة البيانات، لا من العميل */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export const SESSION_COOKIE = "session";
