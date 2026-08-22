import { redirect } from "next/navigation";
import { savePersonAndRedirect } from "@/app/actions/family";
import { PersonForm } from "@/components/admin/PersonForm";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";

export default async function NewPersonPage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/admin/people/new");
  if (user.role !== "admin") redirect("/tree");
  const snapshot = await getSnapshot();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-[family-name:var(--font-script)] text-5xl text-script">
        Add a person
      </h1>
      <div className="mt-8">
        <PersonForm snapshot={snapshot} action={savePersonAndRedirect} />
      </div>
    </main>
  );
}
