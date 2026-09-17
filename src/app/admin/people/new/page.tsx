import { redirect } from "next/navigation";
import { PersonForm } from "@/components/admin/PersonForm";
import { getAppUser, userHasPermission } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { isCommittee } from "@/lib/types";

export default async function NewPersonPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/people/new");
  if (!isCommittee(user.role)) redirect("/");
  if (!userHasPermission(user, "people.create")) redirect("/admin");
  const snapshot = await getSnapshot();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Add a person
      </h1>
      <div className="mt-8">
        <PersonForm snapshot={snapshot} />
      </div>
    </main>
  );
}
