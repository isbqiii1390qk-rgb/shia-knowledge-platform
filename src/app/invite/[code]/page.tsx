import { db } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { notFound, redirect } from "next/navigation";

// صفحة رابط الدعوة — /invite/:code

export default async function InviteLandingPage({
  params,
}: {
  params: { code: string };
}) {
  const invitation = await db.invitation.findUnique({
    where: { token: params.code },
    include: {
      match: true,
      creator: { include: { country: true, statistics: true } },
    },
  });
  if (!invitation) notFound();

  if (invitation.expiresAt < new Date()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="card text-center">
          <h1 className="text-xl font-extrabold">انتهت صلاحية الدعوة</h1>
          <p className="mt-3 text-gray-700">اطلب من صديقك إنشاء رابط جديد.</p>
        </div>
      </main>
    );
  }

  if (invitation.status !== "PENDING" || invitation.match.state !== "WAITING_FOR_PLAYER") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="card text-center">
          <h1 className="text-xl font-extrabold">هذه الدعوة لم تعد صالحة</h1>
          <p className="mt-3 text-gray-700">ربما بدأت المباراة أو امتلأت.</p>
        </div>
      </main>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  if (invitation.creatorId === session.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <div className="card text-center">
          <h1 className="text-xl font-extrabold">هذه دعوتك</h1>
          <p className="mt-3 text-gray-700">
            شارك الرابط مع صديقك — بانتظار انضمامه...
          </p>
          <p className="mt-4 rounded-xl bg-sky-50 p-4 text-sm">
            عندما ينضم الطرف الآخر ستبدأ الجولة تلقائيًا.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="card text-center">
        <h1 className="text-xl font-extrabold">دعوة إلى جولة معرفية</h1>
        <p className="mt-4 font-bold">{invitation.creator.displayName}</p>
        <p className="bidi-safe mt-1 text-sm text-gray-500" dir="auto">
          @{invitation.creator.username} · {invitation.creator.country.nameAr}
        </p>
        <p className="mt-2 text-sm text-gray-600">
          المستوى {invitation.creator.statistics?.level ?? 1} · التقييم{" "}
          {invitation.creator.statistics?.rating ?? 1000}
        </p>
        <JoinButton token={invitation.token} />
      </div>
    </main>
  );
}

function JoinButton({ token }: { token: string }) {
  return (
    <form action="/api/invitations/join" method="post" className="mt-6">
      <input type="hidden" name="token" value={token} />
      <button
        type="submit"
        formAction={async (formData: FormData) => {
          "use server";
          // handled by API route via redirect for progressive enhancement
        }}
        className="btn-primary w-full"
      >
        انضم إلى الجولة
      </button>
    </form>
  );
}
