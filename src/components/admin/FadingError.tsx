"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const VISIBLE_MS = 3400;

export function FadingError({
  title,
  message,
  onDone,
}: {
  title: string;
  message: string;
  onDone: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => onDoneRef.current(), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      className="notice-pop pointer-events-none fixed top-4 left-4 z-[80] w-[min(22rem,calc(100vw-2rem))] rounded-3xl bg-gradient-to-br from-ember/70 to-gold/65 px-4 py-3 text-white shadow-[0_18px_50px_-18px_rgba(42,24,16,0.45)]"
    >
      <p className="font-[family-name:var(--font-display)] text-xl">{title}</p>
      <p className="mt-1 text-sm text-white/90">{message}</p>
    </div>,
    document.body,
  );
}
