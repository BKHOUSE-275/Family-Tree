"use client";

import { useActionState } from "react";
import { saveContactAction, type FormActionState } from "@/app/actions/family";
import type { Contact } from "@/lib/types";

export function ContactForm({
  personId,
  contact,
}: {
  personId: string;
  contact: Contact | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveContactAction,
    null as FormActionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl bg-white p-6 shadow">
      <input type="hidden" name="personId" value={personId} />
      <p className="text-sm text-black/60">
        Committee members can publish shared contact details for this linked person.
      </p>
      <label className="block text-sm font-semibold text-script">
        Address
        <textarea
          name="address"
          defaultValue={contact?.address ?? ""}
          rows={3}
          className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="shareAddress" defaultChecked={contact?.shareAddress} />
        Share address with family
      </label>
      <label className="block text-sm font-semibold text-script">
        Telephone
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={contact?.phone ?? ""}
          className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="sharePhone" defaultChecked={contact?.sharePhone} />
        Share telephone with family
      </label>
      <label className="block text-sm font-semibold text-script">
        Email
        <input
          name="email"
          type="email"
          defaultValue={contact?.email ?? ""}
          className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="shareEmail" defaultChecked={contact?.shareEmail} />
        Share email with family
      </label>
      {state?.error ? <p className="text-sm text-ember">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-leaf-deep">Saved.</p> : null}
      <button
        disabled={pending}
        className="min-h-11 rounded-full bg-script px-6 py-2 text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save contact"}
      </button>
    </form>
  );
}
