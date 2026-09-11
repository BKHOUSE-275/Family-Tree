"use client";

import { useEffect, useState } from "react";
import { SuggestionForm } from "@/components/suggest/SuggestionForm";
import { FamilyTree } from "@/components/tree/FamilyTree";
import type { FamilySnapshot } from "@/lib/types";

export function FamilyLanding({
  snapshot,
  people,
  sent,
  defaultEmail,
  defaultName,
  placeMode = false,
}: {
  snapshot: FamilySnapshot;
  people: { id: string; label: string }[];
  sent: boolean;
  defaultEmail?: string;
  defaultName?: string;
  placeMode?: boolean;
}) {
  const [personId, setPersonId] = useState("");

  useEffect(() => {
    if (window.location.hash !== "#suggest") return;
    document.getElementById("suggest")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [sent]);

  function suggestAbout(id: string) {
    setPersonId(id);
    document.getElementById("suggest")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <div className="mt-8">
        <FamilyTree
          snapshot={snapshot}
          onSuggest={suggestAbout}
          placeMode={placeMode}
        />
      </div>
      <SuggestionForm
        snapshot={snapshot}
        people={people}
        personId={personId}
        onPersonChange={setPersonId}
        sent={sent}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </>
  );
}
