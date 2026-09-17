import { redirect } from "next/navigation";
import {
  cancelAdminInviteAction,
  demoteAdminAction,
  inviteAdminAction,
} from "@/app/actions/committee";
import { AdminPermissionsForm } from "@/components/admin/AdminPermissionsForm";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { defaultAdminPermissions } from "@/lib/types";

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
  const committee = snapshot.profiles.filter(
    (profile) => profile.role === "admin" || profile.role === "super_admin",
  );
  const superAdminCount = committee.filter((profile) => profile.role === "super_admin").length;
  const pendingInvites = snapshot.committeeInvites.filter((invite) => !invite.usedAt);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Admins
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Super admins add committee members and choose which desk tools each
        admin can use. Committee emails live on each admin’s profile.
      </p>

      <section className="mt-10 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Committee</h2>
        <ul className="mt-4 space-y-3">
          {committee.map((profile) => {
            const isSelf = profile.userId === user.id;
            const lastSuper =
              profile.role === "super_admin" && superAdminCount < 2;
            return (
              <li key={profile.userId} className="rounded-2xl bg-page px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{profile.email ?? profile.userId}</p>
                    <p className="text-sm text-black/55">{roleLabel(profile.role)}</p>
                  </div>
                  {isSelf || lastSuper ? null : (
                    <form action={demoteAdminAction}>
                      <input type="hidden" name="userId" value={profile.userId} />
                      <button className="text-sm text-ember hover:underline">Remove admin</button>
                    </form>
                  )}
                </div>
                {profile.role === "admin" ? (
                  <AdminPermissionsForm
                    userId={profile.userId}
                    permissions={profile.permissions ?? defaultAdminPermissions()}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Invite by email</h2>
        <p className="mt-1 text-sm text-black/60">
          They become an admin the next time they enter this address on committee sign-in.
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
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-page px-4 py-3 text-black/70"
              >
                <span>{invite.email} · waiting to sign in</span>
                <form action={cancelAdminInviteAction}>
                  <input type="hidden" name="inviteId" value={invite.id} />
                  <button type="submit" className="text-sm text-ember hover:underline">
                    Cancel invite
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
