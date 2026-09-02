"use client";

import { useActionState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/app/actions/auth";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

export function SignInForm({
  redirectUrl,
  inviteRequired,
}: {
  redirectUrl: string;
  inviteRequired: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInWithEmail, null);

  return (
    <form action={formAction} className="rounded-3xl bg-white p-6 shadow">
      <input type="hidden" name="redirect_url" value={redirectUrl} />
      <label className="block text-sm font-semibold text-script">
        Email
        <input name="email" type="email" required className={fieldClass} />
      </label>
      <label className="mt-4 block text-sm font-semibold text-script">
        Password
        <input name="password" type="password" required className={fieldClass} />
      </label>
      {state?.error ? (
        <p className="mt-3 text-sm text-ember">{state.error}</p>
      ) : null}
      <button
        disabled={pending}
        className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-3 text-center text-sm text-black/60">
        Invited to the committee?{" "}
        <a href="/sign-up" className="text-script underline">
          Create a login
        </a>
        {inviteRequired ? " with the family invite code." : "."}
      </p>
    </form>
  );
}

export function SignUpForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [state, formAction, pending] = useActionState(signUpWithEmail, null);

  return (
    <form action={formAction} className="rounded-3xl bg-white p-6 shadow">
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
