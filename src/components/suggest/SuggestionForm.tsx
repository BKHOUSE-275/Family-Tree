"use client";

import { useEffect, useState } from "react";
import { submitChangeRequestAction } from "@/app/actions/requests";
import { PhotoField } from "@/components/admin/PhotoField";
import { PersonPicker } from "@/components/ui/PersonPicker";
import {
  displayName,
  personVisibility,
  redactPersonForPublic,
  type Contact,
  type FamilySnapshot,
  type Person,
  type PersonPickerOption,
} from "@/lib/types";

type RequestType = "change_info" | "add_person";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-black/10 px-3 py-2 text-base";

function RequiredMark() {
  return (
    <span className="text-ember" aria-hidden="true">
      *
    </span>
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
    <>
      <label className="block text-sm font-semibold text-script">
        Your name <RequiredMark />
        <input
          name="submitterName"
          required
          defaultValue={defaultName}
          autoComplete="name"
          className={fieldClass}
          placeholder="Who is requesting this change"
        />
      </label>
      <label className="block text-sm font-semibold text-script">
        Phone number <RequiredMark />
        <input
          name="submitterPhone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          className={fieldClass}
          placeholder="So the committee can follow up"
        />
      </label>
      <label className="block text-sm font-semibold text-script">
        Email
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          autoComplete="email"
          className={fieldClass}
          placeholder="Optional"
        />
      </label>
    </>
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
  sent,
  defaultEmail = "",
  defaultName = "",
}: {
  snapshot: FamilySnapshot;
  people: PersonPickerOption[];
  personId: string;
  onPersonChange: (id: string) => void;
  sent: boolean;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const selected = personId ? lookupChangeContext(snapshot, personId) : null;

  useEffect(() => {
    if (!sent) return;
    document.getElementById("suggest")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sent]);

  useEffect(() => {
    if (!personId) return;
    setRequestType("change_info");
  }, [personId]);

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
              onClick={() => setRequestType("change_info")}
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
              onClick={() => setRequestType("add_person")}
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
            action={submitChangeRequestAction}
            className="mt-6 space-y-4 rounded-3xl border border-bark/10 bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)] sm:p-6"
          >
            <input type="hidden" name="requestType" value="change_info" />
            <p className="text-sm text-bark/65">
              Fields marked <RequiredMark /> are required. Choose a person to
              load their current details, then edit what should change.
            </p>
            <RequesterFields defaultName={defaultName} defaultEmail={defaultEmail} />
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                    Given name <RequiredMark />
                    <input
                      name="givenName"
                      required
                      defaultValue={selected.person.givenName}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Surname
                    <input
                      name="surname"
                      defaultValue={selected.person.surname}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Maiden name
                    <input
                      name="maidenName"
                      defaultValue={selected.person.maidenName ?? ""}
                      className={fieldClass}
                      placeholder="Birth surname, if different"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Nickname
                    <input
                      name="nickname"
                      defaultValue={selected.person.nickname ?? ""}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Suffix
                    <input
                      name="suffix"
                      defaultValue={selected.person.suffix ?? ""}
                      className={fieldClass}
                      placeholder="Sr, Jr"
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-script">
                  Phone number <RequiredMark />
                  <input
                    name="personPhone"
                    type="tel"
                    inputMode="tel"
                    required
                    defaultValue={selected.contact?.phone ?? ""}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-script">
                  Email
                  <input
                    name="personEmail"
                    type="email"
                    defaultValue={selected.contact?.email ?? ""}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-script">
                  Address
                  <textarea
                    name="address"
                    rows={3}
                    defaultValue={selected.contact?.address ?? ""}
                    className={`${fieldClass} min-h-[4.5rem]`}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                    Birth date
                    <input
                      name="birthDate"
                      defaultValue={selected.person.birthDate ?? ""}
                      className={fieldClass}
                      placeholder="December 1839"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Place of birth
                    <input
                      name="birthPlace"
                      defaultValue={selected.person.birthPlace ?? ""}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-script">
                  <input
                    type="checkbox"
                    name="isDeceased"
                    value="true"
                    defaultChecked={selected.person.isDeceased}
                    className="size-4"
                  />
                  This person is deceased
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-script">
                    Death date
                    <input
                      name="deathDate"
                      defaultValue={selected.person.deathDate ?? ""}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Headstone location
                    <input
                      name="headstoneLocation"
                      defaultValue={selected.person.headstoneLocation ?? ""}
                      className={fieldClass}
                    />
                  </label>
                </div>

                <PersonPicker
                  name="parentId1"
                  people={people}
                  defaultValue={selected.parentIds[0] ?? ""}
                  label="Parent"
                  emptyLabel="Optional"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <PersonPicker
                    name="partnerId"
                    people={people}
                    defaultValue={selected.partnerId}
                    label="Spouse"
                    emptyLabel="Optional"
                  />
                  <span className="hidden sm:block" />
                  <label className="block text-sm font-semibold text-script">
                    Marriage date
                    <input
                      name="marriageDate"
                      defaultValue={selected.marriageDate}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-script">
                    Marriage place
                    <input
                      name="marriagePlace"
                      defaultValue={selected.marriagePlace}
                      className={fieldClass}
                    />
                  </label>
                </div>

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
              className="min-h-11 w-full rounded-full bg-ember px-6 py-2 text-white sm:w-auto"
              disabled={!selected?.person}
            >
              Send to the committee
            </button>
          </form>
        ) : null}

        {requestType === "add_person" ? (
          <form
            action={submitChangeRequestAction}
            className="mt-6 space-y-4 rounded-3xl border border-bark/10 bg-white/90 p-4 shadow-[0_20px_50px_-30px_rgba(42,24,16,0.45)] sm:p-6"
          >
            <input type="hidden" name="requestType" value="add_person" />
            <p className="text-sm text-bark/65">
              Fields marked <RequiredMark /> are required.
            </p>
            <RequesterFields defaultName={defaultName} defaultEmail={defaultEmail} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Given name <RequiredMark />
                <input
                  name="givenName"
                  required
                  className={fieldClass}
                  placeholder="First name"
                />
              </label>
              <label className="block text-sm font-semibold text-script">
                Surname
                <input name="surname" className={fieldClass} placeholder="Last name" />
              </label>
              <label className="block text-sm font-semibold text-script">
                Maiden name
                <input
                  name="maidenName"
                  className={fieldClass}
                  placeholder="Birth surname, if different"
                />
              </label>
              <label className="block text-sm font-semibold text-script">
                Nickname
                <input name="nickname" className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-script">
                Suffix
                <input
                  name="suffix"
                  className={fieldClass}
                  placeholder="Sr, Jr"
                />
              </label>
            </div>

            <label className="block text-sm font-semibold text-script">
              Phone number <RequiredMark />
              <input
                name="personPhone"
                type="tel"
                inputMode="tel"
                required
                className={fieldClass}
                placeholder="Contact phone for this person"
              />
            </label>
            <label className="block text-sm font-semibold text-script">
              Email
              <input
                name="personEmail"
                type="email"
                className={fieldClass}
                placeholder="Optional"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Birth date
                <input
                  name="birthDate"
                  className={fieldClass}
                  placeholder="December 1839"
                />
              </label>
              <label className="block text-sm font-semibold text-script">
                Place of birth
                <input name="birthPlace" className={fieldClass} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-script">
              <input type="checkbox" name="isDeceased" value="true" className="size-4" />
              This person is deceased
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-script">
                Death date
                <input name="deathDate" className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-script">
                Headstone location
                <input name="headstoneLocation" className={fieldClass} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PersonPicker
                name="personId"
                people={people}
                required
                allowNone={false}
                label={
                  <>
                    Related to <RequiredMark />
                  </>
                }
                emptyLabel="Select a person"
              />
              <label className="block text-sm font-semibold text-script">
                How related <RequiredMark />
                <select name="relationshipType" required className="ui-select mt-1">
                  <option value="">Select relationship</option>
                  <option value="child">Child of</option>
                  <option value="parent">Parent of</option>
                  <option value="spouse">Spouse of</option>
                  <option value="sibling">Sibling of</option>
                </select>
              </label>
            </div>

            <PersonPicker
              name="parentId1"
              people={people}
              label="Parent"
              emptyLabel="Optional"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <PersonPicker
                name="partnerId"
                people={people}
                label="Spouse"
                emptyLabel="Optional"
              />
              <span className="hidden sm:block" />
              <label className="block text-sm font-semibold text-script">
                Marriage date
                <input name="marriageDate" className={fieldClass} />
              </label>
              <label className="block text-sm font-semibold text-script">
                Marriage place
                <input name="marriagePlace" className={fieldClass} />
              </label>
            </div>

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
        ) : null}
      </div>
    </section>
  );
}
