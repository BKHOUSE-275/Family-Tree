import { Resend } from "resend";
import { getSnapshot } from "@/lib/store";
import { isCommittee, displayName, type ChangeRequest } from "@/lib/types";

export async function notifyCommitteeOfRequest(request: ChangeRequest) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set; skipping committee email.");
    return;
  }

  const snapshot = await getSnapshot();
  const recipients = [
    ...new Set(
      snapshot.profiles
        .filter((profile) => isCommittee(profile.role) && profile.email)
        .map((profile) => profile.email!.toLowerCase()),
    ),
  ];
  if (!recipients.length) {
    console.warn("No committee email addresses found; skipping alert.");
    return;
  }

  const person = request.personId
    ? snapshot.people.find((row) => row.id === request.personId)
    : null;
  const about = person ? displayName(person) : "the family tree";
  const from = process.env.RESEND_FROM ?? "Family Tree <onboarding@resend.dev>";

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject: `New family tree suggestion about ${about}`,
    text: [
      `${request.submitterEmail ?? "A family member"} submitted a change request.`,
      `About: ${about}`,
      "",
      request.message,
      "",
      "Review it at /admin/requests",
    ].join("\n"),
  });

  if (error) {
    console.error("Could not send committee email", error);
  }
}
