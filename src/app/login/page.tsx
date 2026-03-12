"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } else {
      setError("That's not quite right — try again!");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Family password"
          className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-3 text-brown-dark placeholder:text-warm-gray/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
          autoFocus
        />
      </div>

      {error && (
        <p className="text-center text-sm text-terracotta">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full rounded-lg bg-brown px-4 py-3 font-medium text-cream transition-colors hover:bg-brown-dark disabled:opacity-50"
      >
        {loading ? "Opening..." : "Open Journal"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="paper-texture flex min-h-screen items-center justify-center px-4">
      <div className="scrapbook-card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--font-hand)] text-4xl text-brown-dark">
            Lai Family Scrapbook
          </h1>
          <p className="mt-2 text-sm text-warm-gray">
            Enter the family password to continue
          </p>
        </div>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
