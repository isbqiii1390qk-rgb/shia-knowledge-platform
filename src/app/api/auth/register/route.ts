// API التسجيل — تحقق كامل من المدخلات على الخادم (§7)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { registerSchema } from "@/server/validation/schemas";
import { createSessionToken, SESSION_COOKIE } from "@/server/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }
    const { displayName, username, country, password } = parsed.data;

    const usernameLower = username.toLowerCase();

    const existing = await db.user.findUnique({ where: { usernameLower } });
    if (existing) {
      return NextResponse.json(
        { error: "اسم المستخدم مستخدم بالفعل، اختر اسمًا آخر" },
        { status: 409 }
      );
    }

    const countryRecord = await db.country.findUnique({ where: { code: country } });
    if (!countryRecord) {
      return NextResponse.json({ error: "رمز الدولة غير معروف" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        displayName,
        username,
        usernameLower,
        passwordHash,
        countryId: countryRecord.id,
        settings: { create: {} },
        statistics: { create: {} },
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json(
      { ok: true, username: user.username },
      { status: 201 }
    );
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
