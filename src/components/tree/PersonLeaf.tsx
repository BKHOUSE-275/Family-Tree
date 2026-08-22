import type { CSSProperties } from "react";
import { displayName, yearRange, type Person } from "@/lib/types";

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
        className="hanging-leaf relative isolate aspect-[8/5] w-full min-h-11 text-white hover:brightness-105"
      >
        <svg
          viewBox="0 0 160 100"
          className="absolute inset-0 h-full w-full overflow-visible drop-shadow-md"
          aria-hidden
        >
          <path
            d="M80 2 C 94 4, 148 26, 152 56 C 155 76, 120 95, 80 98 C 40 95, 5 76, 8 56 C 12 26, 66 4, 80 2 Z"
            fill={active ? "var(--leaf-deep)" : "var(--leaf)"}
          />
          <path
            d="M80 12 C 82 50, 80 90"
            fill="none"
            stroke="white"
            strokeOpacity="0.28"
            strokeWidth="1.6"
          />
          <path
            d="M80 34 C 104 40, 124 38 M80 34 C 56 40, 36 38 M80 54 C 100 62, 114 66 M80 54 C 60 62, 46 66"
            fill="none"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="1.3"
          />
          <path
            d="M52 22 C 40 34, 30 48"
            fill="none"
            stroke="white"
            strokeOpacity="0.2"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`relative z-10 flex h-full flex-col items-center justify-center px-3 text-center leading-tight ${
            size === "sm" ? "py-1.5" : "py-2"
          }`}
        >
          <span
            className={`block font-[family-name:var(--font-display)] ${
              size === "sm" ? "text-[0.7rem] sm:text-sm" : "text-sm sm:text-base"
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
          <span className={`block text-white/75 ${size === "sm" ? "text-[0.55rem]" : "text-[0.65rem]"}`}>
            {yearRange(person)}
          </span>
        </span>
      </button>
    </span>
  );
}
