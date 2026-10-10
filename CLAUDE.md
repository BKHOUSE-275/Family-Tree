# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A private family-tree site ("The Story of Felix and Adaline Mitchell") for relatives, many of them non-technical and on phones. Next.js 16 (App Router, React 19), Tailwind 4, Neon Postgres + Drizzle, Neon Auth, Vercel Blob, deployed on Vercel from `main`.

## Commands

```bash
npm run dev            # local dev server (http://localhost:3000)
npm run build          # production build — the main way to type-check everything
npm run lint           # eslint
npm run db:push        # apply src/lib/db/schema.ts to the DB (drizzle-kit)
npm run db:seed        # load booklet names from src/data/seed.ts
npm run db:studio      # drizzle studio
npm run gallery:backup # download all Blob files + gallery/album rows into backups/ (add `-- --prune-orphans` to clean unsaved uploads)
```

There is no test suite. Verify by building, and by running the app (phone width included — see below).

Hand-written SQL migrations live in `drizzle/000N_*.sql`; add a new numbered file alongside any schema change.

## Architecture

**Data layer — `src/lib/store.ts`.** Everything goes through one `FamilySnapshot` (people, contacts, parent/child links, partnerships, residences, siblings, profiles, change requests, audit events, committee invites). `getSnapshot()` loads it from Neon when `DATABASE_URL` is set (auto-seeding an empty DB), otherwise from `.data/family.json` / in-memory seed. Pages generally load the whole snapshot and derive views from it. Gallery data has its own module, `src/lib/gallery-store.ts`.

**Domain types & rules — `src/lib/types.ts`.** Roles (`member` / `admin` / `super_admin`), per-admin permission keys (`people.edit`, `people.create`, `requests.review`, `activity.view`, `gallery.manage`, …), per-person visibility flags (`show*`) with `redactPersonForPublic`, root person ids, and `withoutSlotDemo` (strips slot-demo people from public views).

**Auth — two separate paths.** `src/proxy.ts` (Next 16's name for middleware) guards `/admin` and `/profile`.
- *Committee desk* (`/admin`): email lookup in `src/app/actions/auth.ts` against DB profiles/invites (not `ADMIN_EMAILS` — the README is outdated there). Super admins also enter `FAMILY_GATE_PASSWORD` (rate-limited, `src/lib/passcode.ts`). Session is an HMAC-signed cookie (`src/lib/committee-session.ts`).
- *Family members*: Neon Auth when `NEON_AUTH_BASE_URL` is set, else a local cookie that makes you a super admin in dev.
- `getAppUser()` / `requirePermission()` in `src/lib/auth.ts` are the checks server actions must use.

**Mutations** are server actions in `src/app/actions/*` (family, requests, committee, gallery, auth). Each one checks permission, writes via the store, records an audit event (`src/lib/audit.ts` → `/admin/activity`), and calls `revalidatePath` for every affected page, including `/gallery` and `/gallery/family-tree` when people or photos change. Relatives' edits arrive as change requests (`/suggest`) that a committee member approves or rejects once at `/admin/requests`.

**Tree rendering — `src/components/tree/`.** Circles sit at hand-tuned percentage positions on a 1536×1024 canopy image (`treeSlots.ts`: `CANOPY_EVEN`, `CANOPY_CENTERS`, `BRANCH_*`). `treeGeometry.ts` picks slots by child count: paired left/right seats for even counts, the centerline for odd counts, and overflow seats for large families.

**Photos & media.**
- Blob store is **private**. Files are served through `/api/photos?src=…` (only Blob URLs; only image/video types — never SVG/HTML). Without `BLOB_READ_WRITE_TOKEN`, local dev writes to `public/uploads/` instead.
- Portraits: `src/lib/photo.ts`. Gallery: `/api/gallery/upload` + `src/lib/gallery-*.ts`. Gallery uploads go browser → Blob directly to dodge Vercel's request body limits; `sharp` makes thumbnails/display copies.
- File types are sniffed from bytes, not names/MIME.
- The "Family Tree" album (`family-tree`) is read-only and derived live from people's portrait/headstone photos, honoring `showPhoto` / `showHeadstone`.

## Environment gotchas

- **`.env` points `DATABASE_URL` at the live Neon database (real family data).** Anything you run locally that writes will write real rows. Prefer read-only checks. If a live write test is needed, ask first and delete every test row afterward (people, albums, items, audit events, sessions), then say what was cleaned up.
- No Blob token locally means private Blob portraits show as placeholders in dev — not a bug. `npx vercel env pull .env.local` fixes it.
- `next.config.ts` raises the server-action body limit to 9 MB and transpiles `heic-to`.

## Concerns from polishing the site — keep these intact

**Privacy of living people**
- Contact details, hidden `show*` fields, committee emails, invites, and the activity log are sensitive. Redact on the server before passing data to client components; `redactPersonForPublic` in a client component is not protection.
- Never use an email address as a public display name (e.g. uploader name) — ask for a name.
- Known open issues the user deliberately deferred (don't treat as fixed; don't change auth flows without asking):
  1. `src/app/page.tsx` passes the full `getSnapshot()` to the client `FamilyLanding` even for signed-out visitors.
  2. `lookupCommitteeEmail` in `src/app/actions/auth.ts` opens the committee desk for any (non-super) admin email with no second factor.

**Tree layout**
- Slot percentages in `treeSlots.ts` are hand-tuned. When the user supplies values, apply them exactly — don't "improve" them.
- Layouts must look even and symmetric for every child count (3, 5, 6, 9, 10+), with no dropped or overlapping circles.

**Images / HEIC**
- iPhone HEIC is converted to JPEG **in the browser** before upload (`src/lib/crop-image.ts`, `PhotoField`, `UploadForm`). Server-side HEIC conversion broke on Vercel repeatedly — don't move it back to the server.
- Never show a broken-image icon; use the placeholder tile or a "can't be shown right now" message.

**Phone first**
- Check pages at ~390px: no sideways scroll, full-size tap targets, phone-friendly labels ("Tap to choose…"), visible Prev/Next (not swipe-only), warn before leaving mid-upload.
- Headless Chrome `--window-size` clips narrow widths; render the page inside a 390px iframe for screenshots.

**Look & wording**
- Keep the heirloom theme: color tokens in `src/app/globals.css` (`--page`, `--ink`, `--leaf`, `--bark`, `--ember`, `--gold`, …), script headings, white cards, custom-styled controls rather than browser defaults.
- Errors appear inline, keep what the user typed, and tell relatives what to do in plain words ("Export it as JPEG or PNG and try again"). `src/app/error.tsx` is the friendly fallback.

**Gallery product rules**
- Anyone, even signed out, can view and upload photos/videos with no approval queue (signed-out uploaders give a name). Only `gallery.manage` admins manage albums or remove items. No people-tagging yet.
- Stay on Vercel Blob (watch cost; R2 only if it grows). Keep `gallery:backup` working — it's the family's only copy. Keep rate limits generous enough for a reunion on shared Wi-Fi.

**Committee desk**
- Every committee action is permission-gated and audited. Requests are decided once. Approving an "add person" request must not attach photos to the related person. A person with children cannot be deleted. Members may edit their own contact details. Phone is optional for deceased people.

## Working with this user

- "The form" or "the flyer" may mean `public/reunion-flyer.png` (printed reunion flyer, QR code → `/upload`) rather than `SuggestionForm.tsx` — confirm the target before editing. Flyer edits keep its original style and lettering.
- The user reviews changes before committing; don't commit or push unless asked. Pushing `main` deploys to Vercel.
