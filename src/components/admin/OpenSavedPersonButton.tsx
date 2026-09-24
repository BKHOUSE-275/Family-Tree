"use client";

import { useState } from "react";
import { DeskLink, deskButtonClass } from "@/components/admin/DeskLink";
import { FadingError } from "@/components/admin/FadingError";

export function OpenSavedPersonButton({
  href,
  personName,
  label = "Open saved person",
}: {
  href: string | null;
  personName?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (href) return <DeskLink href={href}>{label}</DeskLink>;

  const who = personName?.trim();
  const message = who
    ? `${who} is not on the family tree yet.`
    : "This person is not on the family tree yet.";

  return (
    <>
      <button type="button" className={deskButtonClass} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <FadingError
          title="Person not on the tree"
          message={message}
          onDone={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
