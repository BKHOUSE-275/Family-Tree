import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactForm } from "@/components/admin/ContactForm";
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
        Family members suggest name, contact, and photo updates through the
        form below the tree. The committee reviews them before they appear.
      </p>

      {person ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="font-[family-name:var(--font-display)] text-2xl">
              {displayName(person)}
            </p>
            {person.maidenName ? (
              <p className="text-sm text-black/60">née {person.maidenName}</p>
            ) : null}
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
            <ContactForm personId={person.id} contact={contact ?? null} />
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
