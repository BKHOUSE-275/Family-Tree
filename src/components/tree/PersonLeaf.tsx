import type { CSSProperties } from "react";
import { displayName, leafFillFor, yearRange, type Person } from "@/lib/types";

export function PersonLeaf({
  person,
  active,
  size = "md",
  rotate = 0,
  swayDelay = 0,
  onClick,
}: {
  person: Person;
  active: boolean;
  size?: "sm" | "md";
  rotate?: number;
  swayDelay?: number;
  onClick: () => void;
}) {
  const nick = person.nickname ? ` “${person.nickname}”` : "";
  const surname = `${person.surname ?? ""}${person.suffix ? ` ${person.suffix}` : ""}`.trim();
  const fill = leafFillFor(person.id, active);

  return (
    <span className={`block ${active ? "z-20 scale-105" : "z-10"}`}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={displayName(person)}
        onClick={onClick}
        style={
          {
            "--leaf-tilt": `${rotate}deg`,
            animationDelay: `${swayDelay}s`,
          } as CSSProperties
        }
        className={`hanging-leaf relative isolate aspect-[8/5] w-full min-h-11 hover:brightness-105 ${
          active ? "text-bark" : "text-white"
        }`}
      >
        <svg
          viewBox="0 0 160 100"
          className="absolute inset-0 h-full w-full overflow-visible drop-shadow-md"
          aria-hidden
        >
          {active ? (
            <path
              d="M80 0 C 96 2, 154 24, 158 56 C 162 78, 122 98, 80 102 C 38 98, -2 78, 2 56 C 6 24, 64 2, 80 0 Z"
              fill="var(--gold)"
              opacity="0.95"
            />
          ) : null}
          <path
            d="M80 2 C 94 4, 148 26, 152 56 C 155 76, 120 95, 80 98 C 40 95, 5 76, 8 56 C 12 26, 66 4, 80 2 Z"
            fill={fill}
          />
          <path
            d="M80 12 C 82 50, 80 90"
            fill="none"
            stroke={active ? "rgba(42,24,16,0.35)" : "white"}
            strokeOpacity={active ? 0.45 : 0.28}
            strokeWidth="1.6"
          />
          <path
            d="M80 34 C 104 40, 124 38 M80 34 C 56 40, 36 38 M80 54 C 100 62, 114 66 M80 54 C 60 62, 46 66"
            fill="none"
            stroke={active ? "rgba(42,24,16,0.3)" : "white"}
            strokeOpacity={active ? 0.35 : 0.22}
            strokeWidth="1.3"
          />
        </svg>
        <span
          className={`relative z-10 flex h-full flex-col items-center justify-center text-center leading-tight ${
            size === "sm" ? "px-1.5 py-1 sm:px-3 sm:py-1.5" : "px-2 py-1.5 sm:px-3 sm:py-2"
          }`}
        >
          <span
            className={`block font-[family-name:var(--font-display)] ${
              size === "sm" ? "text-[0.62rem] sm:text-sm" : "text-xs sm:text-sm md:text-base"
            }`}
          >
            {person.givenName}
            {nick}
          </span>
          {surname ? (
            <span className={`block opacity-90 ${size === "sm" ? "text-[0.6rem]" : "text-[0.7rem]"}`}>
              {surname}
            </span>
          ) : null}
          <span className={`block ${active ? "text-bark/70" : "text-white/80"} ${size === "sm" ? "text-[0.55rem]" : "text-[0.65rem]"}`}>
            {yearRange(person)}
          </span>
        </span>
      </button>
    </span>
  );
}
