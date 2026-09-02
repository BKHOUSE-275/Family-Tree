import Link from "next/link";
import { getSnapshot } from "@/lib/store";

export default async function ActivityPage() {
  const snapshot = await getSnapshot();
  const events = [...snapshot.auditEvents].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Activity
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Recent committee edits, including what changed and who saved it.
      </p>

      {events.length ? (
        <ul className="mt-10 divide-y divide-black/8 rounded-3xl bg-white shadow">
          {events.map((event) => (
            <li key={event.id} className="px-5 py-4">
              <p className="font-[family-name:var(--font-display)] text-xl">{event.entityLabel}</p>
              <p className="text-sm text-black/70">{event.summary}</p>
              <p className="mt-1 text-xs text-black/50">
                {event.actorEmail ?? event.actorUserId} · {event.action.replace(".", " ")} ·{" "}
                {new Date(event.createdAt).toLocaleString()}
                {event.entityId && (event.action.startsWith("person") || event.action === "contact.update") ? (
                  <>
                    {" · "}
                    <Link href={`/admin/people/${event.entityId}`} className="text-ember underline">
                      Open person
                    </Link>
                  </>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-sm text-black/55">No activity yet.</p>
      )}
    </main>
  );
}
