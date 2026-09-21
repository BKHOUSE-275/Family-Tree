import { type Person } from "@/lib/types";

export function HeritagePersonNode({
  person,
  active,
  compact = false,
  onSelect,
}: {
  person: Person;
  active: boolean;
  compact?: boolean;
  onSelect: (id: string) => void;
}) {
  const surname = [person.surname, person.suffix].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      aria-label={`Open ${person.givenName}${surname ? ` ${surname}` : ""}`}
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur();
        onSelect(person.id);
      }}
      className={`relative aspect-square w-full overflow-hidden rounded-full border-2 text-[#fff8e7] shadow-[0_8px_18px_rgba(68,32,13,0.28)] transition duration-200 hover:shadow-[0_0_22px_rgba(239,163,26,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#efa31a]/50 md:border-[3px] md:focus-visible:ring-4 ${
        active
          ? "border-[#ff8a2a] bg-[#d95b16] ring-2 ring-[#ff8a2a]/55 shadow-[0_0_26px_rgba(217,91,22,0.55)] md:ring-4"
          : "border-[#d95b16] bg-[#1a3d29]"
      }`}
    >
      <span className="absolute left-1/2 top-[3%] flex h-[52%] w-[52%] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border border-[#efa31a] bg-[#f4dfbd] font-[family-name:var(--font-display)] font-bold text-[#1a3d29] text-[clamp(0.7rem,18cqi,1.2rem)]">
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.photoUrl}
            alt=""
            className="h-full w-full object-cover grayscale"
          />
        ) : (
          initials(person)
        )}
      </span>
      <span
        className={`absolute inset-x-[2%] top-[58%] font-[family-name:var(--font-display)] font-bold uppercase leading-[1.1] tracking-[0.1em] ${
          compact
            ? "text-[clamp(0.42rem,11cqi,0.7rem)]"
            : "text-[clamp(0.45rem,11cqi,0.88rem)]"
        }`}
      >
        <span className="block truncate">{person.givenName}</span>
        {surname ? <span className="block truncate">{surname}</span> : null}
      </span>
    </button>
  );
}

function initials(person: Person) {
  const given = person.givenName.trim().charAt(0);
  const surname = person.surname?.trim().charAt(0) ?? "";
  return `${given}${surname}`.toUpperCase();
}
