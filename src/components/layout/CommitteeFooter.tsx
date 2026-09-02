import Link from "next/link";

export function CommitteeFooter() {
  return (
    <footer className="relative z-20 border-t border-bark/10 bg-[color:var(--page)]/80 px-4 py-2 text-center text-sm text-bark/55 backdrop-blur">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center hover:text-ember"
      >
        Committee desk
      </Link>
    </footer>
  );
}
