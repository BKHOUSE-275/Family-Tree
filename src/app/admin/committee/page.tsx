import { redirect } from "next/navigation";
import {
  cancelAdminInviteAction,
  inviteAdminAction,
} from "@/app/actions/committee";
import { AdminPermissionsForm } from "@/components/admin/AdminPermissionsForm";
import { CommitteeMemberActions } from "@/components/admin/CommitteeMemberActions";
import { LinkProfileForm } from "@/components/admin/LinkProfileForm";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { defaultAdminPermissions, toPersonPickerOption } from "@/lib/types";

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
  const peopleOptions = snapshot.people.map(toPersonPickerOption);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
      <h1 className="px-1 text-center font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-4xl md:text-5xl">
        Admins
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-center text-black/65">
        Super admins invite committee members, promote admins, and choose which
        desk tools each admin can use. Committee emails live on each admin’s
        profile.
      </p>

      <section className="mt-10 rounded-3xl bg-white p-4 shadow sm:p-6">
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
                <span className="min-w-0 break-all">{invite.email} · waiting to sign in</span>
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

      <section className="mt-8 rounded-3xl bg-white p-4 shadow sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Committee</h2>
        <ul className="mt-4 space-y-3">
          {committee.map((profile) => {
            const isSelf = profile.userId === user.id;
            const lastSuper =
              profile.role === "super_admin" && superAdminCount < 2;
            const canRemove = !isSelf && !lastSuper;
            return (
              <li key={profile.userId} className="rounded-2xl bg-page px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="min-w-0 break-all font-semibold">{profile.email ?? profile.userId}</p>
                    <p className="text-sm text-black/55">{roleLabel(profile.role)}</p>
                  </div>
                  <CommitteeMemberActions
                    userId={profile.userId}
                    label={profile.email ?? profile.userId}
                    canPromote={profile.role === "admin"}
                    canRemove={canRemove}
                  />
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

      <section className="mt-8 rounded-3xl bg-white p-4 shadow sm:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl">Link a login to a person</h2>
        <p className="mt-1 text-sm text-black/60">
          After a relative signs in once, they appear here. Choose who they are
          on the tree so they can add phone, email, and address.
        </p>
        {snapshot.profiles.length ? (
          <ul className="mt-4 space-y-3">
            {snapshot.profiles.map((profile) => (
              <li key={profile.userId} className="rounded-2xl bg-page px-4 py-3">
                <p className="mb-3 min-w-0 break-all text-sm">
                  {profile.email ?? profile.userId}
                  <span className="ml-2 text-xs text-black/45">
                    {profile.role.replace("_", " ")}
                  </span>
                </p>
                <LinkProfileForm
                  userId={profile.userId}
                  defaultPersonId={profile.personId ?? ""}
                  people={peopleOptions}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-black/55">
            No logins yet. Invite an admin, then they appear here after they sign in.
          </p>
        )}
      </section>
    </main>
  );
}
