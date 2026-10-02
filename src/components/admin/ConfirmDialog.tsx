"use client";

import { useEffect, useEffectEvent, useId, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { deskButtonClass } from "@/components/admin/DeskLink";

// Portals need `document`: false on the server and during hydration, true after.
const noopSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Go back",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(noopSubscribe, isClient, isServer);
  const cancelFromDialog = useEffectEvent(() => onCancel());

  useEffect(() => {
    const node = dialogRef.current;
    if (!node || !mounted) return;
    if (!node.open) node.showModal();
    function onDialogCancel(event: Event) {
      event.preventDefault();
      cancelFromDialog();
    }
    node.addEventListener("cancel", onDialogCancel);
    return () => {
      node.removeEventListener("cancel", onDialogCancel);
      if (node.open) node.close();
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="confirm-dialog w-[min(28rem,calc(100vw-1.5rem))] rounded-3xl border-0 bg-white p-0 text-ink shadow-[0_24px_80px_-20px_rgba(42,24,16,0.5)]"
    >
      <div className="p-5 sm:p-6">
        <h2 id={titleId} className="font-[family-name:var(--font-display)] text-2xl text-script">
          {title}
        </h2>
        <p className="mt-2 text-sm text-bark/80">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3 pb-[env(safe-area-inset-bottom)]">
          <button type="button" onClick={onCancel} className={deskButtonClass}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-ember px-5 py-2 text-sm text-white transition hover:bg-gold hover:text-bark"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
