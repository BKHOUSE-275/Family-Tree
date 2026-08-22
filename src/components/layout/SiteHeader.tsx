import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { AppUser } from "@/lib/auth";

export function SiteHeader({ user }: { user: AppUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/8 bg-[color:var(--page)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-[family-name:var(--font-script)] text-2xl text-script">
          Our Roots Run Deep
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/tree" className="hover:text-leaf-deep">
            The Tree
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="hover:text-leaf-deep">
                My profile
              </Link>
              {user.role === "admin" ? (
                <Link href="/admin" className="hover:text-leaf-deep">
                  Admin
                </Link>
              ) : null}
              <form action={signOutAction}>
                <button className="text-script underline-offset-4 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/sign-in" className="hover:text-leaf-deep">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
