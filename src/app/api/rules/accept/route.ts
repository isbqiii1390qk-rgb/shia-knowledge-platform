// API قبول القواعد — يُخزن وقت القبول (§8)
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const user = await db.user.update({
      where: { id: session.userId },
      data: { rulesAccepted: true, rulesAcceptedAt: new Date() },
    });

    return NextResponse.json({ ok: true, rulesAccepted: user.rulesAccepted });
  } catch (e) {
    console.error("accept-rules error:", e);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
