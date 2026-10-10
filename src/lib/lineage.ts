import { displayName, type FamilySnapshot } from "@/lib/types";

// The four branches printed on the reunion flyer ("Lineage (Circle One)").
// Spelled as on the tree, not the flyer ("Autumn", "Phillip", "Mattie Ann").
export const LINEAGES = [
  { id: "james-mitchell", label: "James" },
  { id: "autmon-mitchell", label: "Autmon" },
  { id: "philip-mitchell", label: "Philip" },
  { id: "mittie-ann-mitchell", label: "Mittie Ann" },
] as const;

export function isLineageId(id: string | null): id is (typeof LINEAGES)[number]["id"] {
  return LINEAGES.some((row) => row.id === id);
}

type Links = Pick<FamilySnapshot, "parentChildren">;

function parentsOf(links: Links, personId: string) {
  return links.parentChildren
    .filter((link) => link.childId === personId)
    .map((link) => link.parentId);
}

/** The lineage root and everyone descended from it. */
export function lineageMemberIds(links: Links, lineageId: string) {
  const members = new Set([lineageId]);
  const queue = [lineageId];
  while (queue.length) {
    const current = queue.shift()!;
    for (const link of links.parentChildren) {
      if (link.parentId === current && !members.has(link.childId)) {
        members.add(link.childId);
        queue.push(link.childId);
      }
    }
  }
  return members;
}

/** Which of the four branches a person descends from, if any. */
export function findLineageId(links: Links, personId: string) {
  const seen = new Set<string>();
  const queue = [personId];
  while (queue.length) {
    const current = queue.shift()!;
    if (isLineageId(current)) return current;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...parentsOf(links, current));
  }
  return "";
}

/**
 * Current "Family Details" values for a person on the tree. The Mitchell-side
 * parent is preferred, so a parent who married in isn't shown first.
 */
export function familyDetailsFor(
  snapshot: Pick<FamilySnapshot, "people" | "parentChildren" | "siblings">,
  personId: string,
) {
  const lineageId = findLineageId(snapshot, personId);
  const members = lineageId ? lineageMemberIds(snapshot, lineageId) : new Set<string>();
  const name = (id: string | undefined) => {
    const person = id ? snapshot.people.find((row) => row.id === id) : undefined;
    return person ? displayName(person) : "";
  };
  const mitchellParent = (id: string) => {
    const parents = parentsOf(snapshot, id);
    return parents.find((parentId) => members.has(parentId)) ?? parents[0];
  };

  const parentId = mitchellParent(personId);
  const grandparentId = parentId ? mitchellParent(parentId) : undefined;

  const children = new Set(
    snapshot.parentChildren
      .filter((link) => link.parentId === personId)
      .map((link) => link.childId),
  );
  const siblings = new Set<string>();
  for (const parent of parentsOf(snapshot, personId)) {
    for (const link of snapshot.parentChildren) {
      if (link.parentId === parent) siblings.add(link.childId);
    }
  }
  for (const row of snapshot.siblings) {
    if (row.personAId === personId) siblings.add(row.personBId);
    if (row.personBId === personId) siblings.add(row.personAId);
  }
  siblings.delete(personId);

  return {
    lineageId,
    parentName: name(parentId),
    grandparentName: name(grandparentId),
    childCount: children.size,
    siblingCount: siblings.size,
  };
}
