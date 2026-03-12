"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, childLabel } from "@/lib/utils";

type Photo = {
  id: string;
  blob_url: string;
  media_type: string;
  sort_order: number;
};

type Entry = {
  id: string;
  child: string;
  description: string;
  entry_date: string;
  photos: Photo[];
  created_at: string;
  updated_at: string;
};

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const child = params.child as string;
  const entryId = params.entryId as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editChild, setEditChild] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rotating, setRotating] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/entries/${entryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEntry(data);
          setEditDesc(data.description);
          setEditDate(data.entry_date);
          setEditChild(data.child);
        }
        setLoading(false);
      });
  }, [entryId]);

  async function handleSave() {
    const res = await fetch(`/api/entries/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: editDesc,
        entry_date: editDate,
        child: editChild,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setEntry((prev) =>
        prev
          ? {
              ...prev,
              description: updated.description,
              entry_date: updated.entry_date,
              child: updated.child,
              updated_at: updated.updated_at,
            }
          : null
      );
      setEditing(false);
      if (updated.child !== child) {
        router.push(`/journal/${updated.child}/${entryId}`);
      }
    }
  }

  async function handleRotate(photoId: string) {
    setRotating(photoId);
    try {
      const res = await fetch(`/api/photos/${photoId}/rotate`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setEntry((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            photos: prev.photos.map((p) =>
              p.id === photoId ? { ...p, blob_url: updated.blob_url } : p
            ),
          };
        });
      }
    } catch (err) {
      console.error("Failed to rotate:", err);
    } finally {
      setRotating(null);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this memory? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/journal/${child}`);
    } else {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-48 rounded bg-[#E8E0D6]" />
        <div className="mt-6 h-[300px] rounded-[20px] bg-[#E8E0D6] md:h-[480px]" />
        <div className="max-w-[680px] space-y-4 pt-8">
          <div className="h-3 w-40 rounded bg-[#E8E0D6]" />
          <div className="h-6 w-64 rounded bg-[#E8E0D6]" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-[#E8E0D6]" />
            <div className="h-4 w-3/4 rounded bg-[#E8E0D6]" />
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mt-20 text-center">
        <p className="font-[family-name:var(--font-hand)] text-3xl text-[#C5BEB6]">
          Memory not found
        </p>
        <Link
          href={`/journal/${child}`}
          className="mt-4 inline-block text-sm text-[#D4916E] hover:underline"
        >
          Back to {childLabel(child)}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/journal/${child}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] transition-colors hover:text-[#1A1A1A]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to {childLabel(child)}
      </Link>

      {/* Photos */}
      {entry.photos.length > 0 && (
        <div className="mt-6 space-y-4">
          {entry.photos.map((photo, i) => (
            <div
              key={photo.id}
              className="relative h-[300px] overflow-hidden rounded-[20px] md:h-[480px]"
            >
              {photo.media_type === "video" ? (
                <video
                  src={photo.blob_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                <button
                  onClick={() => setLightboxIndex(i)}
                  className="block h-full w-full cursor-pointer"
                >
                  <img
                    src={photo.blob_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </button>
              )}

              {/* Rotate button */}
              {photo.media_type !== "video" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate(photo.id);
                  }}
                  disabled={rotating === photo.id}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A]/50 text-white transition-colors hover:bg-[#1A1A1A]/70 disabled:opacity-50"
                  title="Rotate photo"
                >
                  {rotating === photo.id ? (
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entry content */}
      <div className="max-w-[680px] pt-8">
        {editing ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-11 rounded-[10px] border border-[#C5BEB6] bg-white px-4 text-sm text-[#3D3D3D] focus:border-[#D4916E] focus:outline-none focus:ring-2 focus:ring-[#D4916E]/20"
              />
              <select
                value={editChild}
                onChange={(e) => setEditChild(e.target.value)}
                className="h-11 appearance-none rounded-[10px] border border-[#C5BEB6] bg-white pl-4 pr-10 text-sm text-[#3D3D3D] focus:border-[#D4916E] focus:outline-none"
              >
                <option value="asher">Asher</option>
                <option value="aiden">Aiden</option>
                <option value="family">Family</option>
                <option value="both">Both Boys</option>
              </select>
            </div>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={6}
              className="w-full rounded-[10px] border border-[#C5BEB6] bg-white px-4 py-3 text-base leading-[1.7] text-[#3D3D3D] placeholder:text-[#C5BEB6] focus:border-[#D4916E] focus:outline-none focus:ring-2 focus:ring-[#D4916E]/20"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="rounded-[10px] bg-[#D4916E] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#C07A5A]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditDesc(entry.description);
                  setEditDate(entry.entry_date);
                  setEditChild(entry.child);
                }}
                className="rounded-[10px] border border-[#C5BEB6] px-5 py-2.5 text-sm text-[#3D3D3D] transition-colors hover:border-[#3D3D3D]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Date + Actions row */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium uppercase tracking-[1px] text-[#D4916E]">
                {formatDate(entry.entry_date)}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#C5BEB6] px-4 py-2 text-[13px] font-medium text-[#3D3D3D] transition-colors hover:border-[#3D3D3D]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[13px] text-[#C5BEB6] transition-colors hover:text-red-400"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {/* Description */}
            {entry.description && (
              <p className="whitespace-pre-wrap text-base leading-[1.7] text-[#3D3D3D]">
                {entry.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {entry.photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    (lightboxIndex - 1 + entry.photos.length) % entry.photos.length
                  );
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % entry.photos.length);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <img
            src={entry.photos[lightboxIndex].blob_url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
