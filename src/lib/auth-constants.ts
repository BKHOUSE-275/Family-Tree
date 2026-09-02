export const LOCAL_AUTH_COOKIE = "family_local_auth";
export const LOCAL_USER_ID = "local-family";

export function isNeonAuthConfigured() {
  return Boolean(
    process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET,
  );
}

export function committeeAllowlist() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}
