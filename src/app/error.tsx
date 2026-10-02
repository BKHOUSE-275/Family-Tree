"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-[family-name:var(--font-script)] text-3xl text-script sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-black/65">
        That did not go through. It may already have been done by someone
        else, or the connection dropped. Please try again.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="min-h-11 rounded-full bg-ember px-6 py-2 text-white transition hover:bg-gold hover:text-bark"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-bark/20 px-6 py-2 text-bark"
        >
          Back to the tree
        </Link>
      </div>
    </main>
  );
}
