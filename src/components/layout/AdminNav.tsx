import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

const navLink = "inline-flex min-h-11 items-center hover:text-gold";

export function AdminNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  return (
    <header className="border-b border-bark/15 bg-bark pt-[env(safe-area-inset-top)] text-[color:var(--page)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <p className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-lg">
          Committee desk
        </p>
        <nav className="flex w-full flex-col text-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Link href="/admin" className={navLink}>
            People
          </Link>
          <Link href="/admin/requests" className={navLink}>
            Change requests
          </Link>
          <Link href="/admin/activity" className={navLink}>
            Activity
          </Link>
          {isSuperAdmin ? (
            <Link href="/admin/committee" className={navLink}>
              Admins
            </Link>
          ) : null}
          <Link href="/" className={navLink}>
            Back to tree
          </Link>
          <form action={signOutAction}>
            <button className={navLink}>Sign out</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
