import { SignUpForm } from "@/components/auth/EmailAuthForms";
import { isNeonAuthConfigured } from "@/lib/auth-constants";

export default function SignUpPage() {
  const neonAuth = isNeonAuthConfigured();
  const inviteRequired =
    Boolean(process.env.FAMILY_INVITE_CODE) || process.env.NODE_ENV === "production";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="font-[family-name:var(--font-script)] text-5xl text-script">
        Join the family tree
      </h1>
      <p className="mt-2 text-center text-black/65">
        Accounts are for relatives only. In development you can leave the invite
        code blank; family members will need the code once you set one.
      </p>
      <div className="mt-8 w-full">
        {neonAuth ? (
          <SignUpForm inviteRequired={inviteRequired} />
        ) : (
          <p className="rounded-3xl bg-white p-6 text-center text-black/65 shadow">
            Neon Auth is not connected yet. Sign in with the local family password
            instead.
          </p>
        )}
      </div>
    </main>
  );
}
