"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import type { AdminPermissions } from "@/lib/types";

const navLink =
  "inline-flex min-h-11 items-center rounded-full px-3 transition hover:bg-white/10 hover:text-gold";

export function AdminNav({
  isSuperAdmin,
  permissions,
}: {
  isSuperAdmin: boolean;
  permissions: AdminPermissions;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-bark/15 bg-bark pt-[env(safe-area-inset-top)] text-[color:var(--page)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex min-h-11 items-center font-[family-name:var(--font-display)] text-lg">
            Committee desk
          </p>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm transition hover:bg-white/10 hover:text-gold sm:hidden"
            aria-expanded={open}
            aria-controls="admin-nav-links"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        <nav
          id="admin-nav-links"
          className={`${open ? "flex" : "hidden"} w-full flex-col text-sm sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4`}
        >
          {isSuperAdmin || permissions["people.edit"] ? (
            <Link href="/admin" className={navLink}>
              People
            </Link>
          ) : null}
          {isSuperAdmin || permissions["requests.review"] ? (
            <Link href="/admin/requests" className={navLink}>
              Change requests
            </Link>
          ) : null}
          {isSuperAdmin || permissions["activity.view"] ? (
            <Link href="/admin/activity" className={navLink}>
              Activity
            </Link>
          ) : null}
          {isSuperAdmin || permissions["gallery.manage"] ? (
            <Link href="/admin/gallery" className={navLink}>
              Gallery
            </Link>
          ) : null}
          {isSuperAdmin ? (
            <Link href="/admin/committee" className={navLink}>
              Admins
            </Link>
          ) : null}
          <Link href="/" className={navLink}>
            Back to tree
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={navLink}>
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
