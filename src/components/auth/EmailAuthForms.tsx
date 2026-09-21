"use client";

import { useActionState } from "react";
import {
  lookupCommitteeEmail,
  signInSuperAdminPasscode,
  signUpWithEmail,
} from "@/app/actions/auth";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

export function SignInForm({
  redirectUrl,
  initialEmail = "",
  initialStep = "email",
  error,
}: {
  redirectUrl: string;
  initialEmail?: string;
  initialStep?: "email" | "passcode";
  error?: string;
  inviteRequired?: boolean;
}) {
  if (initialStep === "passcode") {
    return (
      <form action={signInSuperAdminPasscode} className="rounded-3xl bg-white p-4 shadow sm:p-6">
        <input type="hidden" name="redirect_url" value={redirectUrl} />
        <input type="hidden" name="email" value={initialEmail} />
        <p className="text-sm text-black/65">
          Super admin sign-in for <strong>{initialEmail}</strong>
        </p>
        <label className="mt-4 block text-sm font-semibold text-script">
          Passcode
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={fieldClass}
            placeholder="Family gate password"
          />
        </label>
        {error ? (
          <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember">{error}</p>
        ) : null}
        <button className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white">
          Open the committee desk
        </button>
        <a href="/sign-in" className="mt-3 block w-full text-center text-sm text-script underline">
          Use a different email
        </a>
      </form>
    );
  }

  return (
    <form action={lookupCommitteeEmail} className="rounded-3xl bg-white p-4 shadow sm:p-6">
      <input type="hidden" name="redirect_url" value={redirectUrl} />
      <label className="block text-sm font-semibold text-script">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={initialEmail}
          className={fieldClass}
        />
      </label>
      {error ? (
        <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember">{error}</p>
      ) : null}
      <button className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white">
        Continue
      </button>
    </form>
  );
}

export function SignUpForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <form action={formAction} className="rounded-3xl bg-white p-4 shadow sm:p-6">
      <label className="block text-sm font-semibold text-script">
        Your name
        <input name="name" required className={fieldClass} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-script">
        Email
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-script">
        Password
        <input name="password" type="password" required minLength={8} className={fieldClass} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-script">
        Family invite code
        <input
          name="inviteCode"
          required={inviteRequired}
          placeholder={inviteRequired ? "Ask a super admin" : "Leave blank for developers"}
          className={fieldClass}
        />
      </label>
      {state?.error ? (
        <p className="mt-3 text-sm text-ember">{state.error}</p>
      ) : null}
      <button
        disabled={pending}
        className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="mt-3 text-center text-sm text-black/60">
        Already have an account?{" "}
        <a href="/sign-in" className="text-script underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
