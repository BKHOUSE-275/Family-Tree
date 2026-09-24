"use client";

import { useActionState, useState } from "react";
import {
  demoteAdminAction,
  promoteToSuperAdminAction,
  type CommitteeActionState,
} from "@/app/actions/committee";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deskButtonClass } from "@/components/admin/DeskLink";

export function CommitteeMemberActions({
  userId,
  label,
  canPromote,
  canRemove,
}: {
  userId: string;
  label: string;
  canPromote: boolean;
  canRemove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    promoteToSuperAdminAction,
    null as CommitteeActionState,
  );

  if (!canPromote && !canRemove) return null;

  return (
    <>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
        {canPromote && !open ? (
          <button
            type="button"
            className={deskButtonClass}
            onClick={() => setOpen(true)}
          >
            Make super admin
          </button>
        ) : null}
        {canRemove ? (
          <form action={demoteAdminAction}>
            <input type="hidden" name="userId" value={userId} />
            <ConfirmSubmitButton
              title="Remove admin"
              message={`Remove admin access for ${label}?`}
              confirmLabel="Remove admin"
              className={deskButtonClass}
            >
              Remove admin
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
      {canPromote && open ? (
        <form
          action={formAction}
          className="basis-full space-y-3 rounded-xl bg-white/80 p-3"
        >
          <input type="hidden" name="userId" value={userId} />
          <p className="text-sm text-black/65">
            Enter the family passcode to make {label} a super admin. This gives
            them full committee control.
          </p>
          <label className="block text-sm font-semibold text-script">
            Passcode
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 min-h-11 w-full rounded-xl border border-bark/20 bg-leaf-soft px-3 py-2 text-base"
            />
          </label>
          {state?.error ? <p className="text-sm text-ember">{state.error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 rounded-full bg-ember px-5 py-2 text-white transition hover:bg-gold hover:text-bark disabled:opacity-60"
            >
              {pending ? "Confirming…" : "Confirm"}
            </button>
            <button
              type="button"
              disabled={pending}
              className={`${deskButtonClass} disabled:opacity-60`}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
