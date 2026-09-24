import Link from "next/link";
import type { ReactNode } from "react";

const deskButtonHover =
  "transition hover:border-gold hover:bg-gold hover:text-bark focus-visible:border-gold focus-visible:bg-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 active:border-gold active:bg-gold active:text-bark";

export const deskButtonClass =
  `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-bark/20 bg-white px-4 py-2 text-sm text-bark ${deskButtonHover}`;

export const deskButtonCompactClass =
  `inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-bark/20 bg-white px-3 text-xs text-bark ${deskButtonHover}`;

export function DeskLink({
  href,
  children,
  compact = false,
}: {
  href: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Link href={href} className={compact ? deskButtonCompactClass : deskButtonClass}>
      {children}
    </Link>
  );
}
