// API تسجيل الدخول
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { loginSchema } from "@/server/validation/schemas";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { usernameLower: username.toLowerCase() },
    });
    if (!user) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
