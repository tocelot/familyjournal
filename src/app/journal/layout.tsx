import Link from "next/link";

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F3EBE2]">
      <nav className="flex items-center justify-between px-4 py-4 md:px-12">
        <Link
          href="/"
          className="font-[family-name:var(--font-hand)] text-[26px] text-[#D4916E]"
        >
          Lai Family Logbook
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
      <main className="mx-auto max-w-6xl px-4 pb-16 md:px-12">{children}</main>
    </div>
  );
}
