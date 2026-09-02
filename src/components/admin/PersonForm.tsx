import { PhotoField } from "@/components/admin/PhotoField";
import type { FamilySnapshot, Person } from "@/lib/types";
import { displayName } from "@/lib/types";

export function PersonForm({
  person,
  snapshot,
  action,
}: {
  person?: Person;
  snapshot: FamilySnapshot;
  action: (formData: FormData) => void | Promise<void>;
}) {
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
  const options = snapshot.people.filter((row) => row.id !== person?.id);

  return (
    <form action={action} className="space-y-4 rounded-3xl bg-white p-6 shadow">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      {partnership ? (
        <input type="hidden" name="partnershipId" value={partnership.id} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="givenName" label="Given name" defaultValue={person?.givenName} required />
        <Field name="surname" label="Surname" defaultValue={person?.surname} />
        <Field name="nickname" label="Nickname" defaultValue={person?.nickname} />
        <Field name="suffix" label="Suffix" defaultValue={person?.suffix} placeholder="Sr, Jr" />
        <Field name="birthDate" label="Birth date" defaultValue={person?.birthDate} placeholder="December 1839" />
        <Field name="birthPlace" label="Place of birth" defaultValue={person?.birthPlace} />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isDeceased"
            defaultChecked={person?.isDeceased}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          name="parentId1"
          label="Parent 1"
          options={options}
          defaultValue={parents[0]?.parentId}
        />
        <Select
          name="parentId2"
          label="Parent 2"
          options={options}
          defaultValue={parents[1]?.parentId}
        />
        <Select name="partnerId" label="Spouse" options={options} defaultValue={partnerId} />
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

      <button className="min-h-11 rounded-full bg-script px-6 py-2 text-white">Save person</button>
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

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: Person[];
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-script">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="ui-select mt-1"
      >
        <option value="">None</option>
        {options.map((person) => (
          <option key={person.id} value={person.id}>
            {displayName(person)}
          </option>
        ))}
      </select>
    </label>
  );
}
