import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { entries, photos } from "./schema";

const SEED_PHOTOS_DIR = "C:\\Claude\\logbook\\photos";

const SEED_ENTRIES = [
  {
    child: "asher" as const,
    description:
      "Asher built this incredible paper roll structure — he spent all afternoon engineering it and was so proud when it stayed up!",
    entryDate: "2026-03-08",
    photoFile: "24dc65ed-89e2-4a15-b84c-2fdb49399b74.jpg",
  },
  {
    child: "aiden" as const,
    description:
      "Aiden wanted to help his brother with the paper roll project — he reached up to add the final piece on top all by himself",
    entryDate: "2026-03-08",
    photoFile: "0981239b-2932-45c5-9b07-50d86aab2201.jpg",
  },
  {
    child: "family" as const,
    description:
      "Both boys spent the whole afternoon building Minecraft Lego sets together — Aiden was grinning ear to ear the whole time",
    entryDate: "2026-03-09",
    photoFile: "af360f20-00dd-4f6b-9ca8-cfa46322e06f.jpg",
  },
  {
    child: "aiden" as const,
    description:
      "Aiden decided to give us a piano concert after dinner — he played his own composition and sang along at the top of his lungs",
    entryDate: "2026-03-10",
    photoFile: "fdffd0d0-2699-4f7c-9cab-c6c3000d1f16.jpg",
  },
  {
    child: "asher" as const,
    description:
      "Asher finished his first chapter book today! He's been reading every night before bed and finally made it through all 12 chapters",
    entryDate: "2026-03-05",
    photoFile: null,
  },
  {
    child: "aiden" as const,
    description:
      "Aiden lost his first tooth at school today — he was so excited to put it under his pillow for the tooth fairy",
    entryDate: "2026-03-03",
    photoFile: null,
  },
  {
    child: "asher" as const,
    description:
      "Asher got Student of the Month for showing great kindness to a new kid in his class. So proud of this kid",
    entryDate: "2026-02-28",
    photoFile: null,
  },
  {
    child: "family" as const,
    description:
      "Sunday pancake morning — the boys helped crack eggs and stir the batter. Aiden poured way too much syrup as usual",
    entryDate: "2026-03-02",
    photoFile: null,
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Set it in .env.local or as an environment variable.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log("Seeding database...");

  for (const entry of SEED_ENTRIES) {
    const [created] = await db
      .insert(entries)
      .values({
        child: entry.child,
        description: entry.description,
        entryDate: entry.entryDate,
      })
      .returning();

    console.log(`  Created entry: ${entry.child} - ${entry.description.slice(0, 50)}...`);

    if (entry.photoFile) {
      // In production seeding, photos would be uploaded to Vercel Blob.
      // For local dev, we store a placeholder URL pointing to the local file.
      const placeholderUrl = `/_seed-photos/${entry.photoFile}`;
      await db.insert(photos).values({
        entryId: created.id,
        blobUrl: placeholderUrl,
        blobPathname: `photos/${entry.child}/${entry.entryDate}/${entry.photoFile}`,
        sortOrder: 0,
      });
      console.log(`    Added photo: ${entry.photoFile}`);
    }
  }

  console.log(`\nSeeding complete! Created ${SEED_ENTRIES.length} entries.`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
