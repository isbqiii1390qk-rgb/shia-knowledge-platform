// مصادقة Socket عبر كوكي الجلسة
import { verifySessionToken } from "./session";

export function getSessionPayloadFromCookieHeader(cookieHeader: string) {
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        return [c.slice(0, idx), decodeURIComponent(c.slice(idx + 1))];
      })
  );
  const token = cookies["session"];
  if (!token) return null;
  return verifySessionToken(token);
}
