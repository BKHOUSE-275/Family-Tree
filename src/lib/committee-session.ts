export const COMMITTEE_SESSION_COOKIE = "family_committee_session";
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export type CommitteeSession = {
  email: string;
  userId: string;
};

function sessionSecret() {
  return (
    process.env.NEON_AUTH_COOKIE_SECRET ||
    process.env.FAMILY_GATE_PASSWORD ||
    "dev-committee-session"
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string) {
  const padded =
    value.replaceAll("-", "+").replaceAll("_", "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBase64Url(text: string) {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

function base64UrlToText(value: string) {
  return new TextDecoder().decode(base64UrlToBytes(value));
}

async function sign(message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
}

function sameValue(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

export async function createCommitteeSessionToken(session: CommitteeSession) {
  const payload = textToBase64Url(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_MS }),
  );
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function readCommitteeSessionToken(
  token: string | undefined | null,
): Promise<CommitteeSession | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await sign(payload);
  if (!sameValue(expected, signature)) return null;
  try {
    const data = JSON.parse(base64UrlToText(payload)) as CommitteeSession & {
      exp?: number;
    };
    if (!data.email || !data.userId) return null;
    if (typeof data.exp === "number" && data.exp < Date.now()) return null;
    return { email: data.email.toLowerCase(), userId: data.userId };
  } catch {
    return null;
  }
}

export function committeeSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function expiredCommitteeSessionCookieOptions() {
  return {
    ...committeeSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}
