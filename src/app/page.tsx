import Link from "next/link";
import { CoverScene } from "@/components/cover/CoverScene";
import { getAppUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getAppUser();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-10 text-center">
      <p className="font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl md:text-6xl">
        The Story of Felix and Adaline Mitchell
      </p>
      <CoverScene />
      <p className="mt-2 font-[family-name:var(--font-script)] text-3xl text-script sm:text-4xl">
        Our Roots Run Deep
      </p>
      <p className="mt-6 max-w-xl text-lg text-black/70">
        Click each grand-uncle and grand-aunt under Felix and Adaline to see their
        children, and their children’s children, in one living tree.
      </p>
      <Link
        href={user ? "/tree" : "/sign-in"}
        className="mt-8 rounded-full bg-script px-8 py-3 text-white transition hover:bg-leaf-deep"
      >
        {user ? "Open the tree" : "Sign in to enter"}
      </Link>
    </main>
  );
}
