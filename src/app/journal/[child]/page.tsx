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
  thumbnail_media_type: string | null;
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

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    }
  };

  const label = childLabel(child);

  return (
    <div>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A1A]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to journals
      </Link>

      {/* Header row */}
      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-4xl text-[#1A1A1A]" style={{ lineHeight: 1.1 }}>
          {label}
        </h1>
        <Link
          href={`/journal/${child}/new`}
          className="flex items-center gap-2 rounded-[10px] bg-[#D4916E] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#C07A5A]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          New Entry
        </Link>
      </div>

      {/* Search row */}
      <div className="mt-8 flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-[10px] border border-[#C5BEB6] bg-white pl-11 pr-4 text-sm text-[#3D3D3D] placeholder:text-[#C5BEB6] focus:border-[#D4916E] focus:outline-none focus:ring-2 focus:ring-[#D4916E]/20"
          />
        </div>
        <div className="relative">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-11 appearance-none rounded-[10px] border border-[#C5BEB6] bg-white py-0 pl-4 pr-10 text-sm text-[#3D3D3D] focus:border-[#D4916E] focus:outline-none"
          >
            <option value="all">All time</option>
            <option value="month">This month</option>
            <option value="3months">Last 3 months</option>
            <option value="school">This school year</option>
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Entries */}
      {loading && entries.length === 0 ? (
        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex animate-pulse flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_6px_24px_#1A1A1A0A] md:h-[420px] ${
                i % 2 !== 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <div className="h-[200px] bg-[#E8E0D6] md:h-full md:flex-1" />
              <div className="flex flex-col justify-center gap-4 p-6 md:w-[400px] md:p-8">
                <div className="h-3 w-32 rounded bg-[#E8E0D6]" />
                <div className="h-5 w-48 rounded bg-[#E8E0D6]" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-[#E8E0D6]" />
                  <div className="h-3 w-3/4 rounded bg-[#E8E0D6]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="font-[family-name:var(--font-hand)] text-3xl text-[#C5BEB6]">
            No memories yet
          </p>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            Send a photo via WhatsApp to get started!
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {entries.map((entry, index) => {
            const hasPhoto = !!entry.thumbnail_url;
            const photoOnRight = hasPhoto && index % 2 !== 0;

            return (
              <div
                key={entry.id}
                onClick={() => router.push(`/journal/${child}/${entry.id}`)}
                className={`group flex cursor-pointer flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_6px_24px_#1A1A1A0A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_#1A1A1A14] ${
                  hasPhoto
                    ? `${photoOnRight ? "md:flex-row-reverse" : "md:flex-row"}`
                    : ""
                }`}
              >
                {/* Photo area */}
                {hasPhoto && (
                  <div className="relative overflow-hidden md:flex-1">
                    {entry.thumbnail_media_type === "video" ? (
                      <video
                        src={entry.thumbnail_url!}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        ref={(el) => {
                          if (!el) return;
                          const observer = new IntersectionObserver(
                            ([e]) => {
                              if (e.isIntersecting) {
                                el.play().catch(() => {});
                              } else {
                                el.pause();
                              }
                            },
                            { threshold: 0.5 }
                          );
                          observer.observe(el);
                        }}
                      />
                    ) : (
                      <img
                        src={entry.thumbnail_url!}
                        alt=""
                        className="w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {entry.photo_count > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-[#1A1A1A]/60 px-2.5 py-1 text-xs text-white">
                        +{entry.photo_count - 1} more
                      </span>
                    )}
                    {entry.thumbnail_media_type === "video" && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#1A1A1A]/60 px-2.5 py-1 text-xs text-white">
                        Video
                      </span>
                    )}
                  </div>
                )}

                {/* Content area — compact on mobile */}
                <div
                  className={`flex flex-col justify-center gap-1 px-4 py-3 md:gap-4 md:p-8 ${
                    hasPhoto ? "md:w-[400px] md:min-w-[400px]" : "p-6"
                  }`}
                >
                  <span className="text-xs font-medium uppercase tracking-[1px] text-[#D4916E]">
                    {formatDate(entry.entry_date)}
                  </span>

                  {entry.description && (
                    <p className="truncate text-sm text-[#3D3D3D] md:text-[15px] md:leading-[1.6] md:[display:-webkit-box] md:[-webkit-line-clamp:3] md:[-webkit-box-orient:vertical] md:[white-space:normal]">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {pagination && pagination.page < pagination.total_pages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchEntries(pagination.page + 1, true)}
                disabled={loading}
                className="rounded-[10px] border border-[#C5BEB6] bg-white px-6 py-2.5 text-sm text-[#3D3D3D] transition-colors hover:border-[#D4916E] hover:text-[#D4916E]"
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
