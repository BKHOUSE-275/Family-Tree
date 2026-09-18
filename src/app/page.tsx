import { CommitteeFooter } from "@/components/layout/CommitteeFooter";
import { FamilyLanding } from "@/components/layout/FamilyLanding";
import { getAppUser } from "@/lib/auth";
import { getSnapshot } from "@/lib/store";
import { displayName, isCommittee, sortByBirth, withoutSlotDemo } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; place?: string }>;
}) {
  const user = await getAppUser();
  const committee = Boolean(user && isCommittee(user.role));
  const snapshot = committee ? await getSnapshot() : withoutSlotDemo(await getSnapshot());
  const params = await searchParams;
  const people = sortByBirth(snapshot.people).map((person) => ({
    id: person.id,
    label: displayName(person),
  }));

  return (
    <>
      <main className="flex min-h-full flex-1 flex-col overflow-x-hidden bg-[#f7e0c4]">
        <FamilyLanding
          snapshot={snapshot}
          people={people}
          sent={params.sent === "1"}
          placeMode={committee && params.place === "1"}
          defaultEmail={user?.email ?? ""}
          defaultName={user?.name ?? ""}
        />
      </main>
      {committee ? <CommitteeFooter /> : null}
    </>
  );
}
