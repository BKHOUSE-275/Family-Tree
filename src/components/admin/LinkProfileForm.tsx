"use client";

import { useActionState } from "react";
import { linkProfileAction, type FormActionState } from "@/app/actions/family";
import { PersonPicker, type PersonPickerOption } from "@/components/ui/PersonPicker";

export function LinkProfileForm({
  userId,
  defaultPersonId,
  people,
}: {
  userId: string;
  defaultPersonId: string;
  people: PersonPickerOption[];
}) {
  const [state, formAction, pending] = useActionState(
    linkProfileAction,
    null as FormActionState,
  );

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <PersonPicker
        name="personId"
        people={people}
        defaultValue={defaultPersonId}
        emptyLabel="Not linked"
      />
      {state?.error ? (
        <p className="text-sm text-ember sm:col-span-2">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-leaf-deep sm:col-span-2">Saved.</p>
      ) : null}
      <button
        disabled={pending}
        className="min-h-11 rounded-full bg-script px-5 py-2 text-white disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Saving…" : "Save link"}
      </button>
    </form>
  );
}
