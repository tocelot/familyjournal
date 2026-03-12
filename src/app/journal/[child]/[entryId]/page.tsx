"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, childLabel } from "@/lib/utils";

type Photo = {
  id: string;
  blob_url: string;
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
      <div className="scrapbook-card animate-pulse p-8">
        <div className="h-6 w-48 rounded bg-cream-dark" />
        <div className="mt-6 h-64 rounded bg-cream-dark" />
        <div className="mt-4 h-4 w-3/4 rounded bg-cream-dark" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="py-20 text-center">
        <p className="font-[family-name:var(--font-hand)] text-3xl text-warm-gray">
          Memory not found
        </p>
        <Link
          href={`/journal/${child}`}
          className="mt-4 inline-block text-amber hover:underline"
        >
          Back to {childLabel(child)}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/journal/${child}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-warm-gray hover:text-brown-dark"
      >
        &larr; Back to {childLabel(child)}
      </Link>

      <div className="scrapbook-card p-6 sm:p-8">
        {editing ? (
          <div className="space-y-4">
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-brown-dark focus:border-amber focus:outline-none"
            />
            <select
              value={editChild}
              onChange={(e) => setEditChild(e.target.value)}
              className="ml-3 rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-brown-dark focus:border-amber focus:outline-none"
            >
              <option value="asher">Asher</option>
              <option value="aiden">Aiden</option>
              <option value="family">Family</option>
            </select>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-3 text-brown-dark focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
            />
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="rounded-lg bg-brown px-4 py-2 text-sm font-medium text-cream hover:bg-brown-dark"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-cream-dark px-4 py-2 text-sm text-brown-dark hover:bg-cream-dark"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <p className="font-[family-name:var(--font-hand)] text-3xl text-amber">
                {formatDate(entry.entry_date)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-cream-dark px-3 py-1.5 text-sm text-brown-dark hover:bg-cream-dark"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-terracotta/30 px-3 py-1.5 text-sm text-terracotta hover:bg-terracotta/10"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>

            {entry.photos.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-4">
                {entry.photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightboxIndex(i)}
                    className="photo-frame tape cursor-pointer"
                  >
                    <img
                      src={photo.blob_url}
                      alt=""
                      className="h-48 w-auto max-w-xs object-cover sm:h-64"
                    />
                  </button>
                ))}
              </div>
            )}

            {entry.description && (
              <p className="mt-6 text-lg leading-relaxed text-brown-dark/90">
                {entry.description}
              </p>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            &times;
          </button>

          {entry.photos.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-white/80 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(
                    (lightboxIndex - 1 + entry.photos.length) % entry.photos.length
                  );
                }}
              >
                &lsaquo;
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-white/80 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((lightboxIndex + 1) % entry.photos.length);
                }}
              >
                &rsaquo;
              </button>
            </>
          )}

          <img
            src={entry.photos[lightboxIndex].blob_url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
