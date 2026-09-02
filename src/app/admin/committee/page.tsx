import { redirect } from "next/navigation";
import {
  demoteAdminAction,
  inviteAdminAction,
  promoteAdminAction,
} from "@/app/actions/committee";
import { getAppUser } from "@/lib/auth";
import { committeeAllowlist } from "@/lib/auth-constants";
import { getSnapshot } from "@/lib/store";

function roleLabel(role: string) {
  if (role === "super_admin") return "Super admin";
  if (role === "admin") return "Admin";
  return "Member";
}

export default async function CommitteePage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/committee");
  if (user.role !== "super_admin") redirect("/admin");

  const snapshot = await getSnapshot();
  const envSupers = new Set(committeeAllowlist());
  const committee = snapshot.profiles.filter(
    (profile) => profile.role === "admin" || profile.role === "super_admin",
  );
  const members = snapshot.profiles.filter((profile) => profile.role === "member");
  const pendingInvites = snapshot.committeeInvites.filter((invite) => !invite.usedAt);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Admins
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Super admins add committee members and can take admin access away. Emails
        in ADMIN_EMAILS stay super admins.
      </p>

      <section className="mt-10 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Committee</h2>
        <ul className="mt-4 space-y-3">
          {committee.map((profile) => {
            const locked = Boolean(profile.email && envSupers.has(profile.email.toLowerCase()));
            return (
              <li
                key={profile.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-page px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{profile.email ?? profile.userId}</p>
                  <p className="text-sm text-black/55">
                    {roleLabel(profile.role)}
                    {locked ? " · from ADMIN_EMAILS" : ""}
                  </p>
                </div>
                {locked || profile.userId === user.id ? null : (
                  <form action={demoteAdminAction}>
                    <input type="hidden" name="userId" value={profile.userId} />
                    <button className="text-sm text-ember hover:underline">Remove admin</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Promote a member</h2>
        {members.length ? (
          <form action={promoteAdminAction} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-script">
              Existing login
              <select name="userId" required className="ui-select mt-1">
                <option value="">Choose a member</option>
                {members.map((profile) => (
                  <option key={profile.userId} value={profile.userId}>
                    {profile.email ?? profile.userId}
                  </option>
                ))}
              </select>
            </label>
            <button className="min-h-11 rounded-full bg-ember px-6 py-2 text-white">Make admin</button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-black/55">
            No member logins yet. Invite by email below, or wait for a relative to sign up.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Invite by email</h2>
        <p className="mt-1 text-sm text-black/60">
          They become an admin the next time they sign in with this address.
        </p>
        <form action={inviteAdminAction} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-script">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 min-h-11 w-full rounded-xl border border-bark/20 bg-leaf-soft px-3 py-2 text-base"
            />
          </label>
          <button className="min-h-11 rounded-full bg-ember px-6 py-2 text-white">Send admin invite</button>
        </form>
        {pendingInvites.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="text-black/70">
                {invite.email} · waiting to sign in
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
