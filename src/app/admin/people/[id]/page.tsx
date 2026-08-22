import { notFound, redirect } from "next/navigation";
import { savePersonAndRedirect } from "@/app/actions/family";
import { PersonForm } from "@/components/admin/PersonForm";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName } from "@/lib/types";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (user.role !== "admin") redirect("/tree");

  const { id } = await params;
  const snapshot = await getSnapshot();
  const person = snapshot.people.find((row) => row.id === id);
  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-[family-name:var(--font-script)] text-5xl text-script">
        {displayName(person)}
      </h1>
      <div className="mt-8">
        <PersonForm person={person} snapshot={snapshot} action={savePersonAndRedirect} />
      </div>
    </main>
  );
}
