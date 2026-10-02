export type RequestMessageRow = {
  label: string | null;
  value: string;
};

export type SplitRequestMessage = {
  requestType: string | null;
  submitter: RequestMessageRow[];
  person: RequestMessageRow[];
};

const SUBMITTER_LABELS = new Set(["from", "phone", "email"]);

const PERSON_LABELS: Record<string, string> = {
  "proposed phone": "Contact number",
  "proposed email": "Email",
};

export function parseRequestMessage(message: string): RequestMessageRow[] {
  const rows: RequestMessageRow[] = [];
  for (const raw of message.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator > 0 && separator < 40) {
      rows.push({
        label: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim() || "(none)",
      });
      continue;
    }
    rows.push({ label: null, value: line });
  }
  return rows;
}

function rowValue(message: string, label: string) {
  const row = parseRequestMessage(message).find((entry) => {
    if (entry.label?.toLowerCase() !== label) return false;
    const value = entry.value.trim();
    return value.length > 0 && value !== "(none)";
  });
  return row?.value ?? null;
}

export function splitRequestMessage(message: string): SplitRequestMessage {
  const submitter: RequestMessageRow[] = [];
  const person: RequestMessageRow[] = [];
  const seenSubmitter = new Set<string>();
  let requestType: string | null = null;
  for (const row of parseRequestMessage(message)) {
    const key = row.label?.toLowerCase() ?? "";
    if (key === "type") {
      requestType = row.value;
      continue;
    }
    if (SUBMITTER_LABELS.has(key) && !seenSubmitter.has(key)) {
      seenSubmitter.add(key);
      submitter.push(row);
      continue;
    }
    person.push(
      row.label
        ? { ...row, label: PERSON_LABELS[key] ?? row.label }
        : row,
    );
  }
  return { requestType, submitter, person };
}

function personRowValue(message: string, labels: string[]) {
  const wanted = new Set(labels.map((label) => label.toLowerCase()));
  const row = splitRequestMessage(message).person.find((entry) => {
    const key = entry.label?.toLowerCase() ?? "";
    if (!wanted.has(key)) return false;
    const value = entry.value.trim();
    return value.length > 0 && value !== "(none)";
  });
  return row?.value ?? null;
}

export function messageField(message: string, label: string) {
  return rowValue(message, label);
}

export function personMessageField(message: string, ...labels: string[]) {
  return personRowValue(message, labels);
}

export function requestKindLabel(message: string, personName?: string | null) {
  const type = rowValue(message, "type")?.toLowerCase();
  if (type === "add_person") return "Add Person";
  if (type === "change_info") {
    const name =
      personName?.trim() ||
      rowValue(message, "person") ||
      rowValue(message, "full name") ||
      "person";
    return `Updating ${name}`;
  }
  return personName?.trim() || "Family suggestion";
}

export function proposedPersonName(message: string) {
  return (
    rowValue(message, "full name") ||
    [rowValue(message, "given name"), rowValue(message, "surname")]
      .filter(Boolean)
      .join(" ") ||
    null
  );
}

export function requestSubjectName(message: string, relatedPersonName?: string | null) {
  const type = rowValue(message, "type")?.toLowerCase();
  if (type === "add_person") return proposedPersonName(message);
  return relatedPersonName?.trim() || rowValue(message, "person") || proposedPersonName(message);
}

export function submitterNameFromMessage(message: string) {
  const from = parseRequestMessage(message).find((row) => {
    if (row.label?.toLowerCase() !== "from") return false;
    const value = row.value.trim();
    return value.length > 0 && value !== "(none)";
  });
  return from?.value ?? null;
}

export function isAddPersonRequest(message: string) {
  return rowValue(message, "type")?.toLowerCase() === "add_person";
}

export function savedSubjectPersonId(
  message: string,
  personId: string | null,
  people: { has(id: string): boolean },
) {
  if (isAddPersonRequest(message)) return null;
  if (personId && people.has(personId)) return personId;
  return null;
}

export function requestSubmitter(request: {
  message: string;
  submitterEmail: string | null;
  submitterUserId: string;
}) {
  const isGuest = request.submitterUserId === "guest";
  const name =
    submitterNameFromMessage(request.message) ??
    request.submitterEmail ??
    (isGuest ? "Family member" : request.submitterUserId);
  return { name, isGuest };
}
