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
  const years = yearRange(person);
  const fill = leafFillFor(person.id, active);
  const darkText = active;

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
        className={`hanging-leaf relative isolate aspect-[20/13] w-full min-h-11 hover:brightness-105 ${
          darkText ? "text-bark" : "text-white"
        }`}
      >
        <svg
          viewBox="0 0 200 130"
          className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_6px_10px_rgba(42,24,16,0.38)]"
          aria-hidden
        >
          <path
            d="M100 12 C 108 8, 118 14, 122 28 C 138 10, 160 18, 158 40 C 178 28, 196 48, 184 64 C 200 78, 186 100, 164 96 C 158 114, 128 126, 100 122 C 72 126, 42 114, 36 96 C 14 100, 0 78, 16 64 C 4 48, 22 28, 42 40 C 40 18, 62 10, 78 28 C 82 14, 92 8, 100 12 Z"
            fill={active ? "var(--gold)" : fill}
          />
          <path
            d="M100 22 C 108 20, 114 26, 116 36 C 128 24, 146 30, 144 46 C 158 38, 172 52, 164 64 C 176 74, 166 90, 150 88 C 146 102, 122 110, 100 108 C 78 110, 54 102, 50 88 C 34 90, 24 74, 36 64 C 28 52, 42 38, 56 46 C 54 30, 72 24, 84 36 C 86 26, 92 20, 100 22 Z"
            fill={active ? "#f6d35e" : "white"}
            opacity={active ? 0.28 : 0.14}
          />
          <path
            d="M100 18 C 101 58, 100 108"
            fill="none"
            stroke={darkText ? "rgba(42,24,16,0.38)" : "white"}
            strokeOpacity={darkText ? 0.45 : 0.28}
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M100 42 C 124 36, 146 40 M100 42 C 76 36, 54 40 M100 64 C 122 68, 142 78 M100 64 C 78 68, 58 78 M100 86 C 118 92, 132 98 M100 86 C 82 92, 68 98"
            fill="none"
            stroke={darkText ? "rgba(42,24,16,0.32)" : "white"}
            strokeOpacity={darkText ? 0.32 : 0.2}
            strokeWidth="1.25"
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`relative z-10 flex h-full flex-col items-center justify-center text-center leading-tight ${
            size === "sm" ? "px-2 py-1 sm:px-3 sm:py-1.5" : "px-2.5 py-1.5 sm:px-3.5 sm:py-2"
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
          {years ? (
            <span
              className={`block ${darkText ? "text-bark/70" : "text-white/80"} ${
                size === "sm" ? "text-[0.55rem]" : "text-[0.65rem]"
              }`}
            >
              {years}
            </span>
          ) : null}
        </span>
      </button>
    </span>
  );
}
