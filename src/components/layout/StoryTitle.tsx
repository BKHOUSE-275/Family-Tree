export function StoryTitle({
  className = "",
  size = "lg",
}: {
  className?: string;
  size?: "lg" | "md";
}) {
  const story =
    size === "lg"
      ? "text-3xl sm:text-4xl md:text-5xl"
      : "text-2xl sm:text-3xl md:text-4xl";
  const names =
    size === "lg"
      ? "text-4xl sm:text-5xl md:text-6xl"
      : "text-3xl sm:text-4xl md:text-5xl";

  return (
    <h1 className={`text-center leading-tight ${className}`}>
      <span
        className={`block font-[family-name:var(--font-script)] text-script ${story}`}
      >
        The story of
      </span>
      <span
        className={`mt-1 block font-[family-name:var(--font-script)] text-ember ${names}`}
      >
        Felix and Adaline Mitchell
      </span>
    </h1>
  );
}
