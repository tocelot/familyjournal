export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { eq, sql, desc, or } from "drizzle-orm";
import { verifySession } from "@/lib/session";

type JournalInfo = {
  child: "asher" | "aiden" | "family" | "both";
  label: string;
  subtitle: string;
  entryCount: number;
  latestPhoto: string | null;
};

async function getJournalInfo(): Promise<JournalInfo[]> {
  const journals: JournalInfo[] = [
    {
      child: "asher",
      label: "Asher's Journal",
      subtitle: "Age 8",
      entryCount: 0,
      latestPhoto: null,
    },
    {
      child: "aiden",
      label: "Aiden's Journal",
      subtitle: "Age 5",
      entryCount: 0,
      latestPhoto: null,
    },
    {
      child: "family",
      label: "Family Journal",
      subtitle: "All of us",
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
  const isLoggedIn = await verifySession().catch(() => false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3EBE2]">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-[100px] -top-[50px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,#C3DED840,#C3DED800)]" />
      <div className="pointer-events-none absolute right-[-50px] bottom-[0px] h-[500px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,#D4916E25,#D4916E00)]" />
      <div className="pointer-events-none absolute left-[35%] -top-[100px] h-[450px] w-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,#C4CFDE35,#C4CFDE00)]" />

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center justify-between px-12 py-4">
        <span className="font-[family-name:var(--font-hand)] text-[26px] text-[#D4916E]">
          Lai Family Logbook
        </span>
        {isLoggedIn && (
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A1A]"
            >
              Log out
            </button>
          </form>
        )}
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-4 py-16 md:py-24">
        {/* Title section */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-[family-name:var(--font-hand)] text-5xl text-[#D4916E] md:text-[68px] md:leading-[1.1]">
            Lai Family Logbook
          </h1>
          <div className="h-[2px] w-12 rounded-full bg-[#D4916E]" />
          <p className="text-base text-[#6B6B6B]">
            Pick a journal to start reading
          </p>
        </div>

        {/* Cards */}
        <div className="flex w-full max-w-[1000px] flex-col items-center gap-8 md:flex-row md:justify-center">
          {journals.map((journal) => (
            <Link
              key={journal.child}
              href={`/journal/${journal.child}`}
              className="group w-full max-w-[300px]"
            >
              <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_8px_32px_rgba(26,26,26,0.07)] transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_12px_40px_rgba(26,26,26,0.12)]">
                {/* Photo */}
                <div className="h-[220px] w-full overflow-hidden bg-[#E8E0D6]">
                  {journal.latestPhoto ? (
                    <img
                      src={journal.latestPhoto}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-[family-name:var(--font-hand)] text-2xl text-[#C5BEB6]">
                        No photos yet
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col justify-center gap-2 px-6 py-5">
                  <h2 className="text-[22px] leading-[1.1] text-[#1A1A1A]">
                    {journal.label}
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#6B6B6B]">{journal.subtitle}</span>
                    <span className="text-[#C5BEB6]">&middot;</span>
                    <span className="text-[#6B6B6B]">
                      {journal.entryCount}{" "}
                      {journal.entryCount === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
