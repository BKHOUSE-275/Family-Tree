"use client";

import { useEffect, useState } from "react";
import { SuggestionForm, type RequestType } from "@/components/suggest/SuggestionForm";
import { FamilyTree } from "@/components/tree/FamilyTree";
import type { FamilySnapshot, PersonPickerOption } from "@/lib/types";

export function FamilyLanding({
  snapshot,
  people,
  sent,
  defaultEmail,
  defaultName,
  placeMode = false,
}: {
  snapshot: FamilySnapshot;
  people: PersonPickerOption[];
  sent: boolean;
  defaultEmail?: string;
  defaultName?: string;
  placeMode?: boolean;
}) {
  const [personId, setPersonId] = useState("");
  const [requestType, setRequestType] = useState<RequestType | null>(null);

  useEffect(() => {
    if (window.location.hash !== "#suggest") return;
    document.getElementById("suggest")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [sent]);

  function suggestAbout(id: string) {
    setPersonId(id);
    setRequestType("change_info");
    document.getElementById("suggest")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <FamilyTree
        snapshot={snapshot}
        onSuggest={suggestAbout}
        placeMode={placeMode}
      />
      <SuggestionForm
        snapshot={snapshot}
        people={people}
        personId={personId}
        onPersonChange={setPersonId}
        requestType={requestType}
        onRequestTypeChange={setRequestType}
        sent={sent}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
      />
    </>
  );
}
