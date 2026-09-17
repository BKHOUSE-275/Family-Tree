"use client";

import { useActionState, useEffect, useState } from "react";
import {
  lookupCommitteeEmail,
  signInSuperAdminPasscode,
  signUpWithEmail,
  type CommitteeEmailState,
} from "@/app/actions/auth";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

export function SignInForm({
  redirectUrl,
}: {
  redirectUrl: string;
  inviteRequired?: boolean;
}) {
  const [emailState, emailAction, emailPending] = useActionState(
    lookupCommitteeEmail,
    null as CommitteeEmailState,
  );
  const [passState, passAction, passPending] = useActionState(
    signInSuperAdminPasscode,
    null as CommitteeEmailState,
  );
  const [step, setStep] = useState<"email" | "passcode">("email");
  const email = passState?.email || emailState?.email || "";
  const next = passState?.next || emailState?.next;

  useEffect(() => {
    if (next) window.location.replace(next);
  }, [next]);

  useEffect(() => {
    if (emailState?.step === "passcode" || passState?.step === "passcode") {
      setStep("passcode");
    }
  }, [emailState, passState]);

  if (step === "passcode") {
    return (
      <form action={passAction} className="rounded-3xl bg-white p-6 shadow">
        <input type="hidden" name="redirect_url" value={redirectUrl} />
        <input type="hidden" name="email" value={email} />
        <p className="text-sm text-black/65">
          Super admin sign-in for <strong>{email}</strong>
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
        {passState?.error ? (
          <p className="mt-3 rounded-xl bg-ember/10 px-3 py-2 text-sm text-ember">
            {passState.error}
          </p>
        ) : null}
        <button
          disabled={passPending || Boolean(next)}
          className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white disabled:opacity-60"
        >
          {next ? "Opening…" : passPending ? "Checking…" : "Open the committee desk"}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-sm text-script underline"
          onClick={() => setStep("email")}
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form action={emailAction} className="rounded-3xl bg-white p-6 shadow">
      <input type="hidden" name="redirect_url" value={redirectUrl} />
      <label className="block text-sm font-semibold text-script">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={email}
          className={fieldClass}
        />
      </label>
      {emailState?.error ? (
        <p className="mt-3 text-sm text-ember">{emailState.error}</p>
      ) : null}
      <button
        disabled={emailPending || Boolean(next)}
        className="mt-4 min-h-11 w-full rounded-full bg-script py-2 text-base text-white disabled:opacity-60"
      >
        {next ? "Opening…" : emailPending ? "Checking…" : "Continue"}
      </button>
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
