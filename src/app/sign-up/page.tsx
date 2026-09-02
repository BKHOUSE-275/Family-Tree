import Link from "next/link";
import { SignUpForm } from "@/components/auth/EmailAuthForms";
import { isNeonAuthConfigured } from "@/lib/auth-constants";

export default function SignUpPage() {
  const neonAuth = isNeonAuthConfigured();
  const inviteRequired =
    Boolean(process.env.FAMILY_INVITE_CODE) || process.env.NODE_ENV === "production";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Join the committee
      </h1>
      <p className="mt-2 text-center text-black/65">
        Use the email a super admin invited. After you create this login you can
        help edit the tree.
      </p>
      <div className="mt-8 w-full">
        {neonAuth ? (
          <SignUpForm inviteRequired={inviteRequired} />
        ) : (
          <p className="rounded-3xl bg-white p-6 text-center text-black/65 shadow">
            Neon Auth is not connected yet. Sign in with the local committee
            password instead.{" "}
            <Link href="/sign-in" className="text-script underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
      <Link href="/" className="mt-6 text-sm text-script underline-offset-4 hover:underline">
        Back to the tree
      </Link>
    </main>
  );
}
