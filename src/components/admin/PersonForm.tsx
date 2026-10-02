"use client";

import { useActionState } from "react";
import { savePersonAction, type SavePersonState } from "@/app/actions/family";
import { PhotoField } from "@/components/admin/PhotoField";
import { PersonPicker } from "@/components/ui/PersonPicker";
import {
  PERSON_VISIBILITY_FIELDS,
  personVisibility,
  toAdminPersonPickerOption,
  type FamilySnapshot,
  type Person,
} from "@/lib/types";

export function PersonForm({
  person,
  snapshot,
}: {
  person?: Person;
  snapshot: FamilySnapshot;
}) {
  const [state, formAction, pending] = useActionState(
    savePersonAction,
    null as SavePersonState,
  );
  const parents = person
    ? snapshot.parentChildren.filter((link) => link.childId === person.id)
    : [];
  const partnership = person
    ? snapshot.partnerships.find(
        (union) => union.personAId === person.id || union.personBId === person.id,
      )
    : undefined;
  const partnerId = partnership
    ? partnership.personAId === person?.id
      ? partnership.personBId
      : partnership.personAId
    : "";
  const residences = person
    ? snapshot.residences.filter((row) => row.personId === person.id)
    : [];
  const options = snapshot.people
    .filter((row) => row.id !== person?.id)
    .map(toAdminPersonPickerOption);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl bg-white p-4 shadow sm:p-6">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      {partnership ? (
        <input type="hidden" name="partnershipId" value={partnership.id} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="givenName" label="Given name" defaultValue={person?.givenName} required />
        <Field name="surname" label="Surname" defaultValue={person?.surname} />
        <Field
          name="maidenName"
          label="Maiden name"
          defaultValue={person?.maidenName}
          placeholder="Birth surname, if different"
        />
        <Field name="nickname" label="Nickname" defaultValue={person?.nickname} />
        <Field name="suffix" label="Suffix" defaultValue={person?.suffix} placeholder="Sr, Jr" />
        <Field name="birthDate" label="Birth date" defaultValue={person?.birthDate} placeholder="December 1839" />
        <Field name="birthPlace" label="Place of birth" defaultValue={person?.birthPlace} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isDeceased"
            defaultChecked={person?.isDeceased}
            className="ui-checkbox"
          />
          Deceased
        </label>
        <Field name="deathDate" label="Death date" defaultValue={person?.deathDate} />
        <Field
          name="headstoneLocation"
          label="Headstone location"
          defaultValue={person?.headstoneLocation}
          placeholder="New Bethel Church, Bellville, Florida"
        />
        <Field name="familysearchId" label="FamilySearch ID" defaultValue={person?.familysearchId} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoField defaultUrl={person?.photoUrl} name="photoUrl" label="Profile photo" />
        <PhotoField
          defaultUrl={person?.headstonePhotoUrl}
          name="headstonePhotoUrl"
          label="Headstone photo"
          preview="rect"
        />
      </div>
      <label className="block text-sm font-semibold text-script">
        Notes
        <textarea
          name="notes"
          defaultValue={person?.notes ?? ""}
          rows={4}
          className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
        />
      </label>

      {parents[1]?.parentId ? (
        <input type="hidden" name="parentId2" value={parents[1].parentId} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <PersonPicker
          name="parentId1"
          label="Parent"
          people={options}
          defaultValue={parents[0]?.parentId ?? ""}
          emptyLabel="None"
        />
        <PersonPicker
          name="partnerId"
          label="Spouse"
          people={options}
          defaultValue={partnerId}
          emptyLabel="None"
        />
        <Field name="marriageDate" label="Marriage date" defaultValue={partnership?.startDate} />
        <Field name="marriagePlace" label="Marriage place" defaultValue={partnership?.place} />
        <Field name="marriageNotes" label="Marriage notes" defaultValue={partnership?.notes} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-script">Residences</legend>
        {(residences.length ? residences : [{ year: "", place: "" }, { year: "", place: "" }]).map(
          (row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-3">
              <input
                name="residenceYear"
                defaultValue={"year" in row ? row.year ?? "" : ""}
                placeholder="Year"
                className="min-h-11 rounded-xl border border-black/10 px-3 py-2 text-base"
              />
              <input
                name="residencePlace"
                defaultValue={"place" in row ? row.place : ""}
                placeholder="Place"
                className="min-h-11 rounded-xl border border-black/10 px-3 py-2 text-base sm:col-span-2"
              />
            </div>
          ),
        )}
      </fieldset>

      <section className="rounded-2xl border border-black/10 bg-leaf-soft/50 p-5">
        <h2 className="text-sm font-semibold text-script">Show on the family tree</h2>
        <p className="mt-1 text-sm text-black/60">
          Unchecked details stay in the record for the committee, but visitors
          will not see them.
        </p>
        <div className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {PERSON_VISIBILITY_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-script"
            >
              <input
                type="checkbox"
                name={field.key}
                defaultChecked={personVisibility(person)[field.key]}
                className="ui-checkbox"
              />
              {field.label}
            </label>
          ))}
        </div>
      </section>

      {state?.error ? <p className="text-sm text-ember">{state.error}</p> : null}
      <button
        disabled={pending}
        className="min-h-11 rounded-full bg-script px-6 py-2 text-white transition hover:bg-gold hover:text-bark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save person"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  required,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-script">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base"
      />
    </label>
  );
}
