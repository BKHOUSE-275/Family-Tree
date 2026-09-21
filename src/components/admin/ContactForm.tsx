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
    <form action={formAction} className="space-y-4 rounded-3xl bg-white p-4 shadow sm:p-6">
      <input type="hidden" name="personId" value={personId} />
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-script">
        Contact details
      </h2>
      <p className="text-sm text-black/60">
        Saved for the committee. Check the boxes below to show them on the
        family tree.
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
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-script">
        <input
          type="checkbox"
          name="shareAddress"
          defaultChecked={contact?.shareAddress}
          className="ui-checkbox"
        />
        Show address on the tree
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
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-script">
        <input
          type="checkbox"
          name="sharePhone"
          defaultChecked={contact?.sharePhone}
          className="ui-checkbox"
        />
        Show telephone on the tree
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
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-script">
        <input
          type="checkbox"
          name="shareEmail"
          defaultChecked={contact?.shareEmail}
          className="ui-checkbox"
        />
        Show email on the tree
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
