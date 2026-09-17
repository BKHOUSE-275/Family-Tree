import { SignInForm } from "@/components/auth/EmailAuthForms";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_url?: string | string[];
    email?: string | string[];
    step?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const redirectUrl =
    typeof params.redirect_url === "string" && params.redirect_url.startsWith("/")
      ? params.redirect_url
      : "/admin";
  const initialEmail = typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
  const initialStep = params.step === "passcode" ? "passcode" : "email";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Committee sign in
      </h1>
      <p className="mt-2 text-center text-black/65">
        The tree is open to family. Enter the email a super admin invited to
        the committee desk. Super admins continue to a passcode.
      </p>
      <div className="mt-8 w-full">
        <SignInForm
          redirectUrl={redirectUrl}
          initialEmail={initialEmail}
          initialStep={initialStep}
          error={error}
        />
      </div>
      <Link href="/" className="mt-6 text-sm text-script underline-offset-4 hover:underline">
        Back to the tree
      </Link>
    </main>
  );
}
