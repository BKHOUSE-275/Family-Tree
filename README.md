# The Story of Felix and Adaline Mitchell

A private family tree website. Felix and Adaline sit at the root. Click a grand-uncle or grand-aunt to see their intro (name, birthplace, headstone, and optional contact details) and walk down through their children.

## Run it locally

You need [Node.js](https://nodejs.org) (LTS).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On the cover, choose **Sign in to enter**. While Neon Auth is not connected, leave the family password blank in development and you will enter as an admin.

The booklet names are already loaded from seed data. Without Neon, edits are saved to `.data/family.json` on your computer.

## Connect Neon (database + logins)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string into `.env.local`:

```
DATABASE_URL=postgresql://...
```

3. Create the tables. Either paste [`drizzle/0000_init.sql`](drizzle/0000_init.sql) into the Neon SQL editor, or run:

```bash
npm run db:push
```

4. Load the booklet names (optional if the app auto-seeds an empty database):

```bash
npm run db:seed
```

5. In the Neon Console, open **Auth** and click **Enable Auth**. Copy the Auth URL.

6. Create a cookie secret (at least 32 characters):

```bash
openssl rand -base64 32
```

7. Add these to `.env.local` and to Vercel:

```
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth..../neondb/auth
NEON_AUTH_COOKIE_SECRET=paste-the-secret-here
ADMIN_EMAILS=your-email@example.com
FAMILY_INVITE_CODE=a-phrase-you-share-with-family
```

The first account, and anyone listed in `ADMIN_EMAILS`, becomes a family admin. Relatives create an account on `/sign-up` with the invite code. Then open **Admin** and link their login to their person on the tree so they can fill in phone, email, and address.

Until Neon Auth is connected, set `FAMILY_GATE_PASSWORD` for a shared family password instead.

## Photos (Vercel Blob)

1. In Vercel, enable Blob storage and copy `BLOB_READ_WRITE_TOKEN`.
2. Add it to `.env.local` and the Vercel project.
3. Admins can upload a portrait on each person’s edit page. Locally, photos go to `public/uploads` if Blob is not configured.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables (`DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `ADMIN_EMAILS`, `FAMILY_INVITE_CODE`, `BLOB_READ_WRITE_TOKEN`).
4. Deploy. After the first deploy, run the SQL migration / `db:push` against Neon if you have not already.

```bash
npx vercel
```

## Invite relatives

1. Keep the site private with `FAMILY_INVITE_CODE` (required in production).
2. Send relatives the site URL and the invite code.
3. They create an account, then you open **Admin** and link their login to their person.
4. They open **My profile** and optionally share address, telephone, and email. Nothing is shown on the tree unless they check the share box.

Do not put living people’s phone numbers or addresses in GitHub.

## Tools

- Next.js + TypeScript + Tailwind
- Neon Postgres + Drizzle
- Neon Auth
- Vercel Blob
- Framer Motion
