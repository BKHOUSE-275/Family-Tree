"use client";

import { startTransition, useActionState, useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { submitChangeRequestAction } from "@/app/actions/requests";
import { PhotoField } from "@/components/admin/PhotoField";
import { PersonPicker } from "@/components/ui/PersonPicker";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { LINEAGES, familyDetailsFor, lineageMemberIds } from "@/lib/lineage";
import {
  displayName,
  personVisibility,
  redactPersonForPublic,
  type Contact,
  type FamilySnapshot,
  type Person,
  type PersonPickerOption,
} from "@/lib/types";

export type RequestType = "change_info" | "add_person";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

function RequiredMark() {
  return (
    <span className="text-ember" aria-hidden="true">
      *
    </span>
  );
}

function PersonPhoneField({
  required,
  defaultValue,
  placeholder,
}: {
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-script">
      Their phone number{" "}
      {required ? (
        <RequiredMark />
      ) : (
        <span className="font-normal text-bark/60">(optional for someone who has passed)</span>
      )}
      <PhoneInput
        name="personPhone"
        required={required}
        defaultValue={defaultValue}
        className={fieldClass}
        placeholder={placeholder}
      />
    </label>
  );
}

// Free text so relatives can name a spouse who isn't on the tree yet.
function SpouseField({ defaultValue }: { defaultValue?: string }) {
  return (
    <label className="block text-sm font-semibold text-script">
      Spouse
      <input
        name="spouseName"
        defaultValue={defaultValue}
        autoComplete="off"
        className={fieldClass}
        placeholder="Type their name, e.g. Mary Johnson"
      />
    </label>
  );
}

// Matches the "Family Details" box on the printed reunion flyer.
function FamilyDetailsFields({
  snapshot,
  required,
  defaults,
}: {
  snapshot: FamilySnapshot;
  required: boolean;
  defaults?: ReturnType<typeof familyDetailsFor>;
}) {
  const listId = useId();
  const [lineageId, setLineageId] = useState<string>(defaults?.lineageId ?? "");
  // Suggest names from the chosen branch as they type; anyone can still be typed in.
  const names = useMemo(() => {
    if (!lineageId) return [];
    const members = lineageMemberIds(snapshot, lineageId);
    return snapshot.people.filter((person) => members.has(person.id)).map(displayName);
  }, [snapshot, lineageId]);
  const count = (value: number | undefined) => (value ? String(value) : "");

  return (
    <>
      <label className="block text-sm font-semibold text-script">
        Lineage {required ? <RequiredMark /> : null}
        <span className="block font-normal text-bark/60">
          Which of Felix &amp; Adaline&apos;s children this person comes from
        </span>
        <select
          name="lineage"
          required={required}
          value={lineageId}
          onChange={(event) => setLineageId(event.target.value)}
          className="ui-select mt-1"
        >
          <option value="">Tap to choose a lineage</option>
          {LINEAGES.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-script">
        Parent&apos;s name <span className="font-normal italic text-bark/70">(Mitchell)</span>
        <input
          name="parentName"
          list={listId}
          defaultValue={defaults?.parentName}
          autoComplete="off"
          className={fieldClass}
          placeholder="Mom or dad on the Mitchell side"
        />
      </label>
      <label className="block text-sm font-semibold text-script">
        Grandparent&apos;s name <span className="font-normal italic text-bark/70">(Mitchell)</span>
        <input
          name="grandparentName"
          list={listId}
          defaultValue={defaults?.grandparentName}
          autoComplete="off"
          className={fieldClass}
          placeholder="Grandparent on the Mitchell side"
        />
      </label>
      <datalist id={listId}>
        {[...new Set(names)].map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-script">
          Number of children
          <input
            name="childCount"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            defaultValue={count(defaults?.childCount)}
            className={fieldClass}
            placeholder="e.g. 3"
          />
        </label>
        <label className="block text-sm font-semibold text-script">
          Number of siblings <span className="font-normal italic text-bark/70">(Mitchell)</span>
          <input
            name="siblingCount"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            defaultValue={count(defaults?.siblingCount)}
            className={fieldClass}
            placeholder="e.g. 4"
          />
        </label>
      </div>
    </>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
      {message}
    </p>
  );
}

function RequesterFields({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby="requester-heading"
      className="space-y-4 rounded-2xl border border-gold/50 bg-gold/10 p-4"
    >
      <SectionHeading
        id="requester-heading"
        step={1}
        title="Person Submitting Request"
        hint="So the committee knows who sent this. Your details are not added to the tree."
      />
      <label className="block text-sm font-semibold text-script">
        Your name <RequiredMark />
        <input
          name="submitterName"
          required
          defaultValue={defaultName}
          autoComplete="name"
          className={`${fieldClass} bg-white`}
          placeholder="Your first and last name"
        />
      </label>
      <label className="block text-sm font-semibold text-script">
        Your phone number <RequiredMark />
        <PhoneInput
          name="submitterPhone"
          required
          autoComplete="tel"
          className={`${fieldClass} bg-white`}
          placeholder="e.g. 555-123-4567"
        />
      </label>
      <label className="block text-sm font-semibold text-script">
        Your email
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          className={`${fieldClass} bg-white`}
          placeholder="Optional, e.g. name@example.com"
        />
      </label>
    </div>
  );
}

function SectionHeading({
  id,
  step,
  title,
  hint,
}: {
  id?: string;
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ember font-semibold text-white"
      >
        {step}
      </span>
      <div className="min-w-0">
        <h3 id={id} className="font-[family-name:var(--font-display)] text-xl text-script">
          {title}
        </h3>
        {hint ? <p className="text-sm text-bark/70">{hint}</p> : null}
      </div>
    </div>
  );
}

// Groups follow the printed reunion flyer: Personal Information, then Family Details.
function SubHeading({ children }: { children: ReactNode }) {
  return (
    <p className="border-b border-bark/10 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.12em] text-bark/70">
      {children}
    </p>
  );
}

function lookupChangeContext(snapshot: FamilySnapshot, personId: string) {
  const person = snapshot.people.find((row) => row.id === personId) ?? null;
  if (!person) {
    return {
      person: null as Person | null,
      contact: null as Contact | null,
      parentIds: [] as string[],
      partnerId: "",
      marriageDate: "",
      marriagePlace: "",
      residences: [] as { year: string | null; place: string }[],
    };
  }

  const vis = personVisibility(person);
  const contact = snapshot.contacts.find((row) => row.personId === personId) ?? null;
  const parentIds = snapshot.parentChildren
    .filter((link) => link.childId === personId)
    .map((link) => link.parentId);
  const partnership = snapshot.partnerships.find(
    (union) => union.personAId === personId || union.personBId === personId,
  );
  const partnerId = partnership
    ? partnership.personAId === personId
      ? partnership.personBId
      : partnership.personAId
    : "";
  const residences = vis.showResidences
    ? snapshot.residences
        .filter((row) => row.personId === personId)
        .map((row) => ({ year: row.year, place: row.place }))
    : [];

  return {
    person: redactPersonForPublic(person),
    contact: contact
      ? {
          ...contact,
          address: contact.shareAddress ? contact.address : null,
          phone: contact.sharePhone ? contact.phone : null,
          email: contact.shareEmail ? contact.email : null,
        }
      : null,
    parentIds,
    partnerId,
    marriageDate: vis.showMarriage ? partnership?.startDate ?? "" : "",
    marriagePlace: vis.showMarriage ? partnership?.place ?? "" : "",
    residences,
  };
}

export function SuggestionForm({
  snapshot,
  people,
  personId,
  onPersonChange,
  requestType,
  onRequestTypeChange,
  sent,
  defaultEmail = "",
  defaultName = "",
}: {
  snapshot: FamilySnapshot;
  people: PersonPickerOption[];
  personId: string;
  onPersonChange: (id: string) => void;
  requestType: RequestType | null;
  onRequestTypeChange: (type: RequestType) => void;
  sent: boolean;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const selected = personId ? lookupChangeContext(snapshot, personId) : null;
  const [state, formAction, pending] = useActionState(submitChangeRequestAction, null);
  // Ticking "deceased" makes the phone optional. For an existing person it
  // follows their saved value until the visitor changes the box.
  const [deceasedEdit, setDeceasedEdit] = useState<{ personId: string; value: boolean } | null>(null);
  const [addDeceased, setAddDeceased] = useState(false);
  const changeDeceased =
    deceasedEdit && deceasedEdit.personId === personId
      ? deceasedEdit.value
      : Boolean(selected?.person?.isDeceased);

  // Submitting through a transition (instead of <form action>) keeps what the
  // visitor typed when the server sends back an error.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  useEffect(() => {
    if (!sent) return;
    document.getElementById("suggest")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sent]);

  return (
    <section id="suggest" className="scroll-mt-6 px-3 pb-16 pt-16 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="px-1 text-center font-[family-name:var(--font-script)] text-3xl break-words text-script sm:text-4xl md:text-5xl">
          Suggest an update
        </h2>
        <p className="mt-2 text-center text-bark/75">
          Choose how you would like to help. The committee reviews every
          suggestion before anything appears on the live tree.
        </p>

        {sent ? (
          <p className="mt-6 rounded-2xl bg-gold/30 px-4 py-3 text-center text-bark">
            Thank you. The committee has been notified and will review your
            suggestion.
          </p>
        ) : null}

        <div className="mt-8 rounded-3xl border border-bark/15 bg-white/80 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onRequestTypeChange("change_info")}
              aria-pressed={requestType === "change_info"}
              className={`min-h-28 rounded-2xl border px-4 py-5 text-left transition ${
                requestType === "change_info"
                  ? "border-ember bg-ember/10 shadow-[0_12px_30px_-20px_rgba(42,24,16,0.55)]"
                  : "border-bark/20 bg-white/90 hover:border-bark/40"
              }`}
            >
              <span className="block font-[family-name:var(--font-display)] text-xl text-script">
              Update a family member’s information
              </span>
              <span className="mt-2 block text-sm text-bark/70">
                Update a selected person&apos;s details. Adding a picture is
                included.
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRequestTypeChange("add_person")}
              aria-pressed={requestType === "add_person"}
              className={`min-h-28 rounded-2xl border px-4 py-5 text-left transition ${
                requestType === "add_person"
                  ? "border-ember bg-ember/10 shadow-[0_12px_30px_-20px_rgba(42,24,16,0.55)]"
                  : "border-bark/20 bg-white/90 hover:border-bark/40"
              }`}
            >
              <span className="block font-[family-name:var(--font-display)] text-xl text-script">
                Adding a person
              </span>
              <span className="mt-2 block text-sm text-bark/70">
                Suggest someone new to add to the family tree.
              </span>
            </button>
          </div>
        </div>

        {requestType === "change_info" ? (
          <form
            onSubmit={submit}
            className="mt-6 space-y-4 rounded-3xl border border-bark/10 bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)] sm:p-6"
          >
            <input type="hidden" name="requestType" value="change_info" />
            <FormError message={state?.error} />
            <p className="text-sm text-bark/65">
              Fields marked <RequiredMark /> are required. Choose a person to
              load their current details, then edit what should change.
            </p>
            <RequesterFields defaultName={defaultName} defaultEmail={defaultEmail} />
            <div className="border-t border-bark/10 pt-4">
              <SectionHeading
                step={2}
                title="Who needs updating"
                hint="Choose the family member, then change anything that's wrong or missing."
              />
            </div>
            <PersonPicker
              name="personId"
              required
              allowNone={false}
              value={personId}
              onChange={onPersonChange}
              people={people}
              label={
                <>
                  About this person <RequiredMark />
                </>
              }
              emptyLabel="Select a person"
            />

            {selected?.person ? (
              <div key={selected.person.id} className="space-y-4 border-t border-bark/10 pt-4">
                <p className="font-[family-name:var(--font-display)] text-xl text-script">
                  Current info for {displayName(selected.person)}
                </p>
                <SubHeading>Personal information</SubHeading>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                    Given name <RequiredMark />
                    <input
                      name="givenName"
                      required
                      defaultValue={selected.person.givenName}
                      className={fieldClass}
                      placeholder="e.g. Mary"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Surname
                    <input
                      name="surname"
                      defaultValue={selected.person.surname}
                      className={fieldClass}
                      placeholder="e.g. Mitchell"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Nickname
                    <input
                      name="nickname"
                      defaultValue={selected.person.nickname ?? ""}
                      className={fieldClass}
                      placeholder="e.g. Sissy"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Maiden name
                    <input
                      name="maidenName"
                      defaultValue={selected.person.maidenName ?? ""}
                      className={fieldClass}
                      placeholder="Birth surname if different, e.g. Johnson"
                    />
                  </label>
                </div>
                {/* No suffix box; send the saved one so the request doesn't read as "(none)". */}
                <input type="hidden" name="suffix" value={selected.person.suffix ?? ""} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <SpouseField
                    defaultValue={people.find((row) => row.id === selected.partnerId)?.label ?? ""}
                  />
                  <span className="hidden sm:block" />
                  <label className="block text-sm font-semibold text-script">
                    Marriage date
                    <input
                      name="marriageDate"
                      defaultValue={selected.marriageDate}
                      className={fieldClass}
                      placeholder="e.g. June 1962"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Marriage place
                    <input
                      name="marriagePlace"
                      defaultValue={selected.marriagePlace}
                      className={fieldClass}
                      placeholder="e.g. Richmond, Virginia"
                    />
                  </label>
                </div>

                <PersonPhoneField
                  required={!changeDeceased}
                  defaultValue={selected.contact?.phone ?? ""}
                  placeholder="e.g. 555-123-4567"
                />
                <label className="block text-sm font-semibold text-script">
                  Their email
                  <input
                    name="personEmail"
                    type="email"
                    defaultValue={selected.contact?.email ?? ""}
                    className={fieldClass}
                    placeholder="Optional, e.g. name@example.com"
                  />
                </label>
                <label className="block text-sm font-semibold text-script">
                  Place of residence
                  <input
                    name="address"
                    defaultValue={selected.contact?.address ?? ""}
                    className={fieldClass}
                    placeholder="City, State, e.g. Richmond, VA"
                  />
                </label>

                {selected.residences.length ? (
                  <div>
                    <p className="text-sm font-semibold text-script">Current residences</p>
                    <ul className="mt-2 space-y-1 text-sm text-bark/75">
                      {selected.residences.map((row) => (
                        <li key={`${row.year}-${row.place}`}>
                          {row.year ? <strong>{row.year}: </strong> : null}
                          {row.place}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <SubHeading>Family details</SubHeading>
                <FamilyDetailsFields
                  snapshot={snapshot}
                  required={false}
                  defaults={familyDetailsFor(snapshot, selected.person.id)}
                />

                <SubHeading>Other details</SubHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                    Birth date
                    <input
                      name="birthDate"
                      defaultValue={selected.person.birthDate ?? ""}
                      className={fieldClass}
                      placeholder="e.g. December 1839"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Place of birth
                    <input
                      name="birthPlace"
                      defaultValue={selected.person.birthPlace ?? ""}
                      className={fieldClass}
                      placeholder="e.g. Halifax County, Virginia"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-script">
                  <input
                    type="checkbox"
                    name="isDeceased"
                    value="true"
                    checked={changeDeceased}
                    onChange={(event) =>
                      setDeceasedEdit({ personId, value: event.target.checked })
                    }
                    className="size-4"
                  />
                  This person is deceased
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                     Date of Death (Month/Year)
                    <input
                      name="deathDate"
                      defaultValue={selected.person.deathDate ?? ""}
                      className={fieldClass}
                      placeholder="e.g. March 1998"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Headstone location{" "}
                    <span className="font-normal text-bark/60">(church or general area)</span>
                    <input
                      name="headstoneLocation"
                      defaultValue={selected.person.headstoneLocation ?? ""}
                      className={fieldClass}
                      placeholder="e.g. New Bethel Church, or Bellville, Florida"
                    />
                  </label>
                </div>

                <PhotoField
                  name="photoUrl"
                  label="Profile photo (optional)"
                  defaultUrl={selected.person.photoUrl}
                />
                <PhotoField
                  name="headstonePhotoUrl"
                  label="Headstone photo (optional)"
                  preview="rect"
                  defaultUrl={selected.person.headstonePhotoUrl}
                />
              </div>
            ) : (
              <p className="rounded-2xl bg-bark/5 px-4 py-3 text-sm text-bark/70">
                Select a person above to load their current information.
              </p>
            )}

            <button
              className="min-h-11 w-full rounded-full bg-ember px-6 py-2 text-white disabled:opacity-60 sm:w-auto"
              disabled={!selected?.person || pending}
            >
              {pending ? "Sending…" : "Send to the committee"}
            </button>
          </form>
        ) : null}

        {requestType === "add_person" ? (
          <form
            onSubmit={submit}
            className="mt-6 space-y-4 rounded-3xl border border-bark/10 bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)] sm:p-6"
          >
            <input type="hidden" name="requestType" value="add_person" />
            <FormError message={state?.error} />
            <p className="text-sm text-bark/65">
              Fields marked <RequiredMark /> are required.
            </p>
            <RequesterFields defaultName={defaultName} defaultEmail={defaultEmail} />
            <div className="border-t border-bark/10 pt-4">
              <SectionHeading
                step={2}
                title="The person you're adding"
                hint="Tell us about the new family member."
              />
            </div>

            <SubHeading>Personal information</SubHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Given name <RequiredMark />
                <input
                  name="givenName"
                  required
                  className={fieldClass}
                  placeholder="First name, e.g. Mary"
                />
              </label>
              <label className="block text-sm font-semibold text-script">
                Surname
                <input name="surname" className={fieldClass} placeholder="Last name, e.g. Mitchell" />
              </label>
              <label className="block text-sm font-semibold text-script">
                Nickname
                <input name="nickname" className={fieldClass} placeholder="e.g. Sissy" />
              </label>
              <label className="block text-sm font-semibold text-script">
                Maiden name
                <input
                  name="maidenName"
                  className={fieldClass}
                  placeholder="Birth surname if different, e.g. Johnson"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SpouseField />
              <span className="hidden sm:block" />
              <label className="block text-sm font-semibold text-script">
                Marriage date
                <input name="marriageDate" className={fieldClass} placeholder="e.g. June 1962" />
              </label>
              <label className="block text-sm font-semibold text-script">
                Marriage place
                <input
                  name="marriagePlace"
                  className={fieldClass}
                  placeholder="e.g. Richmond, Virginia"
                />
              </label>
            </div>

            <PersonPhoneField
              required={!addDeceased}
              placeholder="e.g. 555-123-4567"
            />
            <label className="block text-sm font-semibold text-script">
              Their email
              <input
                name="personEmail"
                type="email"
                className={fieldClass}
                placeholder="Optional, e.g. name@example.com"
              />
            </label>
            <label className="block text-sm font-semibold text-script">
              Place of residence
              <input
                name="address"
                className={fieldClass}
                placeholder="City, State, e.g. Richmond, VA"
              />
            </label>

            <SubHeading>Family details</SubHeading>
            <FamilyDetailsFields snapshot={snapshot} required />

            <SubHeading>Other details</SubHeading>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Birth date (Month/Year)
                <input
                  name="birthDate"
                  className={fieldClass}
                  placeholder="e.g. December 1839"
                />
              </label>
              <label className="block text-sm font-semibold text-script">
                Place of birth
                <input
                  name="birthPlace"
                  className={fieldClass}
                  placeholder="e.g. Halifax County, Virginia"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-script">
              <input
                type="checkbox"
                name="isDeceased"
                value="true"
                checked={addDeceased}
                onChange={(event) => setAddDeceased(event.target.checked)}
                className="size-4"
              />
              This person is deceased
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Date of Death (Month/Year)
                <input name="deathDate" className={fieldClass} placeholder="e.g. March 1998" />
              </label>
              <label className="block text-sm font-semibold text-script">
                Headstone location{" "}
                <span className="font-normal text-bark/60">(church or general area)</span>
                <input
                  name="headstoneLocation"
                  className={fieldClass}
                  placeholder="e.g. New Bethel Church, or Bellville, Florida"
                />
              </label>
            </div>

            <PhotoField name="photoUrl" label="Profile photo (optional)" />
            <PhotoField
              name="headstonePhotoUrl"
              label="Headstone photo (optional)"
              preview="rect"
            />
            <button
              className="min-h-11 w-full rounded-full bg-ember px-6 py-2 text-white disabled:opacity-60 sm:w-auto"
              disabled={pending}
            >
              {pending ? "Sending…" : "Send to the committee"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
