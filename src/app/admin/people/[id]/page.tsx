import { notFound, redirect } from "next/navigation";
import { savePersonAndRedirect } from "@/app/actions/family";
import { PersonForm } from "@/components/admin/PersonForm";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee } from "@/lib/types";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");

  const { id } = await params;
  const snapshot = await getSnapshot();
  const person = snapshot.people.find((row) => row.id === id);
  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        {displayName(person)}
      </h1>
      <div className="mt-8">
        <PersonForm person={person} snapshot={snapshot} action={savePersonAndRedirect} />
      </div>
    </main>
  );
}
