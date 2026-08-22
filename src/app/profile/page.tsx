import { redirect } from "next/navigation";
import { saveContactAction } from "@/app/actions/family";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName } from "@/lib/types";

export default async function ProfilePage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/profile");

  const snapshot = await getSnapshot();
  const person = user.personId
    ? snapshot.people.find((row) => row.id === user.personId)
    : null;
  const contact = person
    ? snapshot.contacts.find((row) => row.personId === person.id)
    : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="font-[family-name:var(--font-script)] text-5xl text-script">
        My profile
      </h1>
      <p className="mt-2 text-black/65">
        Share a phone number, email, or address only if you want the rest of the
        family to see it.
      </p>

      {person ? (
        <form action={saveContactAction} className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow">
          <input type="hidden" name="personId" value={person.id} />
          <p className="font-[family-name:var(--font-display)] text-2xl">
            {displayName(person)}
          </p>
          <label className="block text-sm font-semibold text-script">
            Address
            <textarea
              name="address"
              defaultValue={contact?.address ?? ""}
              rows={3}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareAddress" defaultChecked={contact?.shareAddress} />
            Share address with family
          </label>
          <label className="block text-sm font-semibold text-script">
            Telephone
            <input
              name="phone"
              defaultValue={contact?.phone ?? ""}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="sharePhone" defaultChecked={contact?.sharePhone} />
            Share telephone with family
          </label>
          <label className="block text-sm font-semibold text-script">
            Email
            <input
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="shareEmail" defaultChecked={contact?.shareEmail} />
            Share email with family
          </label>
          <button className="rounded-full bg-script px-6 py-2 text-white">Save my details</button>
        </form>
      ) : (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow">
          <p>
            Your login is not linked to a person on the tree yet. Ask a family
            admin to connect your account so you can add your telephone, email,
            and address.
          </p>
          <p className="mt-3 text-sm text-black/55">
            Signed in as {user.email ?? user.name ?? user.id}
          </p>
        </div>
      )}
    </main>
  );
}
