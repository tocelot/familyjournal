import Link from "next/link";

export default function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="paper-texture min-h-screen">
      <nav className="sticky top-0 z-50 border-b border-cream-dark bg-cream/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="font-[family-name:var(--font-hand)] text-2xl text-brown-dark transition-colors hover:text-brown"
          >
            Growing Up Journal
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-warm-gray transition-colors hover:bg-cream-dark hover:text-brown-dark"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
