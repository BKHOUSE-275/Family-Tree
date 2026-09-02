"use client";

import { useEffect } from "react";
import { submitChangeRequestAction } from "@/app/actions/requests";
import { PhotoField } from "@/components/admin/PhotoField";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

export function SuggestionForm({
  people,
  personId,
  onPersonChange,
  sent,
  defaultEmail = "",
  defaultName = "",
}: {
  people: { id: string; label: string }[];
  personId: string;
  onPersonChange: (id: string) => void;
  sent: boolean;
  defaultEmail?: string;
  defaultName?: string;
}) {
  useEffect(() => {
    if (!sent) return;
    document.getElementById("suggest")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sent]);

  return (
    <section id="suggest" className="scroll-mt-6 pt-16">
      <div className="mx-auto max-w-xl">
        <h2 className="text-center font-[family-name:var(--font-script)] text-4xl text-script sm:text-5xl">
          Share a memory
        </h2>
        <p className="mt-2 text-center text-bark/75">
          A name, a date, a story, or a photo. The committee reads every note
          before anything appears on the live tree.
        </p>

        {sent ? (
          <p className="mt-6 rounded-2xl bg-gold/30 px-4 py-3 text-center text-bark">
            Thank you. The committee has been notified and will review your note.
          </p>
        ) : null}

        <form
          action={submitChangeRequestAction}
          className="mt-8 space-y-4 rounded-3xl border border-bark/10 bg-white/90 p-6 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)]"
        >
          <label className="block text-sm font-semibold text-script">
            Your name
            <input
              name="name"
              defaultValue={defaultName}
              autoComplete="name"
              className={fieldClass}
              placeholder="So the committee knows who to thank"
            />
          </label>
          <label className="block text-sm font-semibold text-script">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              autoComplete="email"
              className={fieldClass}
              placeholder="In case they need to follow up"
            />
          </label>
          <label className="block text-sm font-semibold text-script">
            About this person
            <select
              name="personId"
              value={personId}
              onChange={(event) => onPersonChange(event.target.value)}
              className="ui-select mt-1"
            >
              <option value="">General family note</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-script">
            What should we add or change?
            <textarea
              name="message"
              required
              rows={6}
              className={`${fieldClass} min-h-[6rem]`}
              placeholder="Names, dates, stories, or where a photo belongs."
            />
          </label>
          <PhotoField name="photoUrl" label="Profile photo (optional)" />
          <PhotoField
            name="headstonePhotoUrl"
            label="Headstone photo (optional)"
            preview="rect"
          />
          <button className="min-h-11 w-full rounded-full bg-ember px-6 py-2 text-white sm:w-auto">
            Send to the committee
          </button>
        </form>
      </div>
    </section>
  );
}
