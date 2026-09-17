import { notFound, redirect } from "next/navigation";
import { PersonForm } from "@/components/admin/PersonForm";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee } from "@/lib/types";

export default async function EditPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string | string[] }>;
}) {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "people.edit")) redirect("/admin");

  const { id } = await params;
  const saved = (await searchParams).saved === "1";
  const snapshot = await getSnapshot();
  const person = snapshot.people.find((row) => row.id === id);
  if (!person) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        {displayName(person)}
      </h1>
      {saved ? (
        <p className="mt-4 rounded-2xl bg-leaf-soft px-4 py-3 text-center text-sm text-leaf-deep">
          Saved.
        </p>
      ) : null}
      <div className="mt-8">
        <PersonForm person={person} snapshot={snapshot} />
      </div>
    </main>
  );
}
