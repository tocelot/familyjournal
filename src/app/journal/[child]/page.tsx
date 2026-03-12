"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { childLabel, formatDate, truncate } from "@/lib/utils";

type EntryPreview = {
  id: string;
  child: string;
  description: string;
  entry_date: string;
  thumbnail_url: string | null;
  photo_count: number;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const child = params.child as string;

  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchEntries = useCallback(
    async (page = 1, append = false) => {
      setLoading(true);
      const params = new URLSearchParams({ child, page: String(page), limit: "20" });

      if (search) params.set("search", search);

      if (dateFilter !== "all") {
        const now = new Date();
        let from: string;
        if (dateFilter === "month") {
          from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        } else if (dateFilter === "3months") {
          from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0];
        } else {
          const schoolYearStart = now.getMonth() >= 7
            ? new Date(now.getFullYear(), 7, 1)
            : new Date(now.getFullYear() - 1, 7, 1);
          from = schoolYearStart.toISOString().split("T")[0];
        }
        params.set("from", from);
      }

      const res = await fetch(`/api/entries?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries((prev) => (append ? [...prev, ...data.entries] : data.entries));
        setPagination(data.pagination);
      }
      setLoading(false);
    },
    [child, search, dateFilter]
  );

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const label = childLabel(child);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-hand)] text-4xl text-brown-dark">
          {label}
        </h1>
        <Link
          href={`/journal/${child}/new`}
          className="flex h-10 items-center gap-2 rounded-lg bg-brown px-4 text-sm font-medium text-cream transition-colors hover:bg-brown-dark"
        >
          + New Entry
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search memories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-cream-dark bg-warm-white px-4 py-2 text-sm placeholder:text-warm-gray/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
        />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-cream-dark bg-warm-white px-3 py-2 text-sm text-brown-dark focus:border-amber focus:outline-none"
        >
          <option value="all">All time</option>
          <option value="month">This month</option>
          <option value="3months">Last 3 months</option>
          <option value="school">This school year</option>
        </select>
      </div>

      {loading && entries.length === 0 ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="scrapbook-card animate-pulse p-6">
              <div className="h-4 w-32 rounded bg-cream-dark" />
              <div className="mt-4 h-48 rounded bg-cream-dark" />
              <div className="mt-4 h-4 w-3/4 rounded bg-cream-dark" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-[family-name:var(--font-hand)] text-3xl text-warm-gray">
            No memories yet
          </p>
          <p className="mt-2 text-sm text-warm-gray/70">
            Send a photo via WhatsApp to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => router.push(`/journal/${child}/${entry.id}`)}
              className="scrapbook-card block w-full cursor-pointer p-6 text-left transition-shadow hover:shadow-md"
            >
              <p className="font-[family-name:var(--font-hand)] text-xl text-amber">
                {formatDate(entry.entry_date)}
              </p>

              {entry.thumbnail_url && (
                <div className="photo-frame mt-4 inline-block">
                  <img
                    src={entry.thumbnail_url}
                    alt=""
                    className="h-48 w-full object-cover sm:h-56"
                  />
                  {entry.photo_count > 1 && (
                    <span className="absolute bottom-1 right-2 rounded-full bg-brown/80 px-2 py-0.5 text-xs text-cream">
                      +{entry.photo_count - 1} more
                    </span>
                  )}
                </div>
              )}

              {entry.description && (
                <p className="mt-4 leading-relaxed text-brown-dark/80">
                  {truncate(entry.description, 200)}
                </p>
              )}
            </button>
          ))}

          {pagination && pagination.page < pagination.total_pages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchEntries(pagination.page + 1, true)}
                disabled={loading}
                className="rounded-lg border border-cream-dark px-6 py-2 text-sm text-brown-dark transition-colors hover:bg-cream-dark"
              >
                {loading ? "Loading..." : "Load more memories"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
