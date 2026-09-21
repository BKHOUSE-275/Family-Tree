export function StoryTitle({
  className = "",
  size = "lg",
}: {
  className?: string;
  size?: "lg" | "md";
}) {
  const story =
    size === "lg"
      ? "text-2xl leading-snug sm:text-4xl md:text-5xl"
      : "text-xl leading-snug sm:text-3xl md:text-4xl";
  const names =
    size === "lg"
      ? "text-[1.7rem] leading-snug sm:text-5xl md:text-6xl"
      : "text-2xl leading-snug sm:text-4xl md:text-5xl";

  return (
    <h1 className={`px-4 text-center ${className}`}>
      <span
        className={`block font-[family-name:var(--font-script)] text-script ${story}`}
      >
        The story of
      </span>
      <span
        className={`mt-2 block font-[family-name:var(--font-script)] text-ember ${names}`}
      >
        <span className="block sm:hidden">
          Felix and
          <span className="block">Adaline Mitchell</span>
        </span>
        <span className="hidden sm:block">Felix and Adaline Mitchell</span>
      </span>
    </h1>
  );
}
