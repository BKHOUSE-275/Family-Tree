import { config } from "dotenv";
import { seedSnapshot } from "../src/data/seed";
import { getDb, isDatabaseConfigured } from "../src/lib/db";
import {
  contacts,
  parentChildren,
  partnerships,
  people,
  profiles,
  residences,
  siblings,
} from "../src/lib/db/schema";

config({ path: ".env" });
config({ path: ".env.local", override: true });

async function main() {
  if (!isDatabaseConfigured()) {
    console.error("Set DATABASE_URL in .env.local first.");
    process.exit(1);
  }

  const db = getDb();
  const snapshot = seedSnapshot;

  await db.insert(people).values(
    snapshot.people.map((p) => ({
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  ).onConflictDoNothing();

  if (snapshot.parentChildren.length) {
    await db.insert(parentChildren).values(snapshot.parentChildren).onConflictDoNothing();
  }
  if (snapshot.partnerships.length) {
    await db.insert(partnerships).values(snapshot.partnerships).onConflictDoNothing();
  }
  if (snapshot.residences.length) {
    await db.insert(residences).values(snapshot.residences).onConflictDoNothing();
  }
  if (snapshot.siblings.length) {
    await db.insert(siblings).values(snapshot.siblings).onConflictDoNothing();
  }
  if (snapshot.contacts.length) {
    await db.insert(contacts).values(snapshot.contacts).onConflictDoNothing();
  }
  if (snapshot.profiles.length) {
    await db.insert(profiles).values(snapshot.profiles).onConflictDoNothing();
  }

  console.log(`Seeded ${snapshot.people.length} people into Neon.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
