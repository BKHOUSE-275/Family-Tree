import { signInLocal } from "@/app/actions/auth";
import { SignInForm } from "@/components/auth/EmailAuthForms";
import { isNeonAuthConfigured } from "@/lib/auth-constants";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>;
}) {
  const params = await searchParams;
  const redirectUrl =
    typeof params.redirect_url === "string" && params.redirect_url.startsWith("/")
      ? params.redirect_url
      : "/admin";
  const neonAuth = isNeonAuthConfigured();
  const inviteRequired = Boolean(process.env.FAMILY_INVITE_CODE);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <h1 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
        Committee sign in
      </h1>
      <p className="mt-2 text-center text-black/65">
        The tree is open to family. Sign in here only if a super admin invited
        you to the committee desk.
      </p>
      <div className="mt-8 w-full">
        {neonAuth ? (
          <SignInForm redirectUrl={redirectUrl} inviteRequired={inviteRequired} />
        ) : (
          <form action={signInLocal} className="rounded-3xl bg-white p-6 shadow">
            <input type="hidden" name="redirect_url" value={redirectUrl} />
            <label className="block text-sm font-semibold text-script">
              Committee password
              <input
                name="password"
                type="password"
                className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
                placeholder={
                  process.env.NODE_ENV === "production"
                    ? "Ask a super admin"
                    : "Leave blank while developing"
                }
              />
            </label>
            <button className="mt-4 min-h-11 w-full rounded-full bg-ember py-2 text-base text-white">
              Open the committee desk
            </button>
            <p className="mt-3 text-xs text-black/55">
              Local mode is on until Neon Auth is connected. In production, set
              FAMILY_GATE_PASSWORD or enable Auth in your Neon project.
            </p>
          </form>
        )}
      </div>
      <Link href="/" className="mt-6 text-sm text-script underline-offset-4 hover:underline">
        Back to the tree
      </Link>
    </main>
  );
}
