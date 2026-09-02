import { CommitteeFooter } from "@/components/layout/CommitteeFooter";
import { FamilyLanding } from "@/components/layout/FamilyLanding";
import { StoryTitle } from "@/components/layout/StoryTitle";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee, sortByBirth } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const user = await getAppUser();
  const snapshot = await getSnapshot();
  const params = await searchParams;
  const people = sortByBirth(snapshot.people).map((person) => ({
    id: person.id,
    label: displayName(person),
  }));

  return (
    <>
      <main className="relative flex min-h-full flex-1 flex-col overflow-x-hidden">
        <div className="autumn-sky absolute inset-0" />
        <div className="relative z-10 mx-auto w-full max-w-[96rem] flex-1 px-3 pb-20 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6">
          <p className="text-center font-[family-name:var(--font-script)] text-2xl text-script/80 sm:text-3xl">
            Our roots run deep
          </p>
          <StoryTitle size="lg" className="mt-2" />
          <p className="mx-auto mt-4 max-w-2xl text-center text-bark/80">
            Felix and Adaline stand at the roots. Click a Granduncle or Grandaunt
            to see only that person and their children. Use Reset to return to the
            full canopy.
          </p>
          <p className="mt-3 text-center">
            <a
              href="#suggest"
              className="inline-flex min-h-11 items-center text-sm text-ember underline-offset-4 hover:underline"
            >
              Share a story or photo
            </a>
          </p>
          <FamilyLanding
            snapshot={snapshot}
            people={people}
            sent={params.sent === "1"}
            defaultEmail={user?.email ?? ""}
            defaultName={user?.name ?? ""}
          />
        </div>
      </main>
      {user && isCommittee(user.role) ? <CommitteeFooter /> : null}
    </>
  );
}
