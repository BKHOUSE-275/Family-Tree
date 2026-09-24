"use client";

import { useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export function ConfirmSubmitButton({
  title,
  message,
  confirmLabel,
  className,
  name,
  value,
  formAction,
  children,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  className?: string;
  name?: string;
  value?: string;
  formAction?: string | ((formData: FormData) => void | Promise<void>);
  children: ReactNode;
}) {
  const hiddenRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <button
        ref={hiddenRef}
        type="submit"
        name={name}
        value={value}
        formAction={formAction}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      {open ? (
        <ConfirmDialog
          title={title}
          message={message}
          confirmLabel={confirmLabel}
          onCancel={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
            hiddenRef.current?.click();
          }}
        />
      ) : null}
    </>
  );
}
