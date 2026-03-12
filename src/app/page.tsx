export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { eq, sql, desc, or } from "drizzle-orm";

type JournalInfo = {
  child: "asher" | "aiden" | "family" | "both";
  label: string;
  subtitle: string;
  color: string;
  entryCount: number;
  latestPhoto: string | null;
};

async function getJournalInfo(): Promise<JournalInfo[]> {
  const journals: JournalInfo[] = [
    {
      child: "asher",
      label: "Asher's Journal",
      subtitle: "Age 8",
      color: "from-amber/90 to-amber-light/70",
      entryCount: 0,
      latestPhoto: null,
    },
    {
      child: "aiden",
      label: "Aiden's Journal",
      subtitle: "Age 5",
      color: "from-sage/90 to-sage-light/70",
      entryCount: 0,
      latestPhoto: null,
    },
    {
      child: "family",
      label: "Family Journal",
      subtitle: "All of us",
      color: "from-terracotta/90 to-amber/70",
      entryCount: 0,
      latestPhoto: null,
    },
  ];

  try {
    for (const journal of journals) {
      const condition =
        journal.child === "both"
          ? eq(entries.child, "both")
          : or(eq(entries.child, journal.child), eq(entries.child, "both"));

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(entries)
        .where(condition);

      journal.entryCount = Number(countResult.count);

      const latestEntries = await db
        .select({ id: entries.id })
        .from(entries)
        .where(condition)
        .orderBy(desc(entries.entryDate))
        .limit(5);

      for (const entry of latestEntries) {
        const [photo] = await db
          .select({ blobUrl: photos.blobUrl })
          .from(photos)
          .where(eq(photos.entryId, entry.id))
          .limit(1);

        if (photo) {
          journal.latestPhoto = photo.blobUrl;
          break;
        }
      }
    }
  } catch {
    // Database not yet connected — show empty state
  }

  return journals;
}

export default async function LandingPage() {
  const journals = await getJournalInfo();

  return (
    <div className="paper-texture flex min-h-screen flex-col items-center px-4 py-12">
      <h1 className="font-[family-name:var(--font-hand)] text-5xl text-brown-dark md:text-6xl">
        Lai Family Logbook
      </h1>
      <p className="mt-3 text-warm-gray">Pick a journal to start reading</p>

      <div className="mt-12 grid w-full max-w-4xl gap-8 md:grid-cols-3">
        {journals.map((journal) => (
          <Link
            key={journal.child}
            href={`/journal/${journal.child}`}
            className="group"
          >
            <div className="journal-cover flex h-72 flex-col justify-between p-6 text-cream transition-transform group-hover:-translate-y-1 group-hover:shadow-lg md:h-80">
              <div>
                <h2 className="font-[family-name:var(--font-hand)] text-3xl leading-tight">
                  {journal.label}
                </h2>
                <p className="mt-1 text-sm text-cream/70">{journal.subtitle}</p>
              </div>

              {journal.latestPhoto && (
                <div className="photo-frame mx-auto -mb-2 w-28 rotate-2">
                  <img
                    src={journal.latestPhoto}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </div>
              )}

              <p className="font-[family-name:var(--font-hand)] text-lg text-cream/80">
                {journal.entryCount}{" "}
                {journal.entryCount === 1 ? "memory" : "memories"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
