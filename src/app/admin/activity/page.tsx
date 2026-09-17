import Link from "next/link";
import { redirect } from "next/navigation";
import { buildActivityFeed, groupActivityByDay, type ActivityStatus } from "@/lib/activity";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { isCommittee } from "@/lib/types";

const FILTERS: { id: "all" | ActivityStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Needs review" },
  { id: "confirmed", label: "Confirmed" },
  { id: "declined", label: "Declined" },
];

function statusLabel(status: ActivityStatus) {
  if (status === "pending") return "Needs review";
  if (status === "declined") return "Declined";
  return "Confirmed";
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/activity");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "activity.view")) redirect("/admin");

  const raw = (await searchParams).filter;
  const filter =
    raw === "pending" || raw === "confirmed" || raw === "declined" ? raw : "all";
  const snapshot = await getSnapshot();
  const items = buildActivityFeed(snapshot).filter(
    (item) => filter === "all" || item.status === filter,
  );
  const groups = groupActivityByDay(items);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Activity
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Everything family sent and everything the committee confirmed or declined.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {FILTERS.map((item) => {
          const active = item.id === filter;
          const href = item.id === "all" ? "/admin/activity" : `/admin/activity?filter=${item.id}`;
          return (
            <Link
              key={item.id}
              href={href}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                active ? "bg-script text-white" : "bg-white text-bark shadow"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {groups.length ? (
        <div className="mt-10 space-y-8">
          {groups.map((group) => (
            <section key={group.label}>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-script">
                {group.label}
              </h2>
              <ul className="mt-3 divide-y divide-black/8 rounded-3xl bg-white shadow">
                {group.items.map((item) => (
                  <li key={item.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-[family-name:var(--font-display)] text-xl">{item.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.status === "pending"
                            ? "bg-gold/80 text-bark"
                            : item.status === "declined"
                              ? "bg-black/8 text-black/60"
                              : "bg-leaf-soft text-leaf-deep"
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <p className="text-sm text-black/70">{item.summary}</p>
                    <p className="mt-1 text-xs text-black/50">
                      {item.actor} · {new Date(item.createdAt).toLocaleString()}
                      {item.href ? (
                        <>
                          {" · "}
                          <Link href={item.href} className="text-ember underline">
                            Open
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-sm text-black/55">No activity in this view yet.</p>
      )}
    </main>
  );
}
