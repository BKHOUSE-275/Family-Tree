import Link from "next/link";
import { redirect } from "next/navigation";
import { saveContactAction } from "@/app/actions/family";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee } from "@/lib/types";

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
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        My profile
      </h1>
      <p className="mt-2 text-center text-black/65">
        Family members send photos and story updates through the suggestion
        form. The committee reviews them before they appear on the tree.
      </p>

      {person ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="font-[family-name:var(--font-display)] text-2xl">
              {displayName(person)}
            </p>
            <p className="mt-2 text-sm text-black/60">
              Signed in as {user.email ?? user.name ?? user.id}
            </p>
            <Link
              href="/#suggest"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ember px-6 py-2 text-white"
            >
              Suggest an update
            </Link>
          </div>

          {isCommittee(user.role) ? (
            <form action={saveContactAction} className="space-y-4 rounded-3xl bg-white p-6 shadow">
              <input type="hidden" name="personId" value={person.id} />
              <p className="text-sm text-black/60">
                Committee members can publish shared contact details for this
                linked person.
              </p>
              <label className="block text-sm font-semibold text-script">
                Address
                <textarea
                  name="address"
                  defaultValue={contact?.address ?? ""}
                  rows={3}
                  className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
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
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={contact?.phone ?? ""}
                  className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
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
                  className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="shareEmail" defaultChecked={contact?.shareEmail} />
                Share email with family
              </label>
              <button className="min-h-11 rounded-full bg-script px-6 py-2 text-white">Save contact</button>
            </form>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow">
          <p>
            Your login is not linked to a person on the tree yet. Ask the
            committee to connect your account. You can still send a suggestion.
          </p>
          <p className="mt-3 text-sm text-black/55">
            Signed in as {user.email ?? user.name ?? user.id}
          </p>
          <Link
            href="/#suggest"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-ember px-6 py-2 text-white"
          >
            Suggest an update
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-script underline-offset-4 hover:underline">
          Back to the tree
        </Link>
      </p>
    </main>
  );
}
