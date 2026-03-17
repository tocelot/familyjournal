"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const journals = [
  { slug: "asher", label: "Asher" },
  { slug: "aiden", label: "Aiden" },
  { slug: "family", label: "Family" },
];

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const currentChild = params.child as string | undefined;

  // Only show tabs when we're inside a journal route (not on /journal itself, if that existed)
  const showTabs = !!currentChild;

  // Check if we're on a sub-page (entry detail, new entry) — tabs still navigate to the journal timeline
  const isJournalTimeline = pathname === `/journal/${currentChild}`;

  return (
    <div className="min-h-screen bg-[#F3EBE2]">
      <nav className="flex items-center justify-between px-4 py-4 md:px-12">
        <Link
          href="/"
          className="font-[family-name:var(--font-hand)] text-[26px] text-[#D4916E]"
        >
          Lai Family Scrapbook
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A1A]"
          >
            Log out
          </button>
        </form>
      </nav>

      {/* Journal navigation tabs */}
      {showTabs && (
        <div className="mx-auto max-w-6xl px-4 md:px-12">
          <div className="flex gap-1 rounded-[12px] bg-[#E8E0D6]/60 p-1">
            {journals.map((j) => {
              const isActive = currentChild === j.slug;
              return (
                <Link
                  key={j.slug}
                  href={`/journal/${j.slug}`}
                  className={`flex-1 rounded-[10px] py-2 text-center text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#D4916E] shadow-sm"
                      : "text-[#6B6B6B] hover:text-[#3D3D3D]"
                  }`}
                >
                  {j.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-12">{children}</main>
    </div>
  );
}
