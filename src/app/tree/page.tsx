import { redirect } from "next/navigation";
import { FamilyTree } from "@/components/tree/FamilyTree";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";

export default async function TreePage() {
  const user = await getAppUser();
  if (!user) redirect("/sign-in?redirect_url=/tree");
  const snapshot = await getSnapshot();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <p className="font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        The Story of Felix and Adaline Mitchell
      </p>
      <p className="mt-1 max-w-2xl text-black/65">
        Felix and Adaline stand at the roots. Their children hang as leaves in
        the canopy — click a leaf to open that person’s intro and drop their
        descendants from the branch.
      </p>
      <div className="mt-8">
        <FamilyTree snapshot={snapshot} />
      </div>
    </main>
  );
}
