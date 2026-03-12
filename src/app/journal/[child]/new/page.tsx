"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { childLabel } from "@/lib/utils";

type PhotoPreview = {
  file: File;
  preview: string;
};

export default function NewEntryPage() {
  const params = useParams();
  const router = useRouter();
  const child = params.child as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedChild, setSelectedChild] = useState(child);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos: PhotoPreview[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      newPhotos.push({ file, preview: URL.createObjectURL(file) });
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description && photos.length === 0) {
      setError("Add a description or at least one photo");
      return;
    }

    setSubmitting(true);
    setError("");

    const photoData = await Promise.all(
      photos.map(async (p) => {
        const buffer = await p.file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        return {
          data: base64,
          filename: p.file.name,
          content_type: p.file.type,
        };
      })
    );

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child: selectedChild,
        description,
        entry_date: entryDate,
        photos: photoData.length > 0 ? photoData : undefined,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      router.push(`/journal/${selectedChild}/${created.id}`);
    } else {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Link
        href={`/journal/${child}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-warm-gray hover:text-brown-dark"
      >
        &larr; Back to {childLabel(child)}
      </Link>

      <h1 className="mb-6 font-[family-name:var(--font-hand)] text-4xl text-brown-dark">
        New Memory
      </h1>

      <form onSubmit={handleSubmit} className="scrapbook-card space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brown-dark">
              Date
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-brown-dark focus:border-amber focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brown-dark">
              Journal
            </label>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="rounded-lg border border-cream-dark bg-cream/50 px-3 py-2 text-brown-dark focus:border-amber focus:outline-none"
            >
              <option value="asher">Asher</option>
              <option value="aiden">Aiden</option>
              <option value="family">Family</option>
              <option value="both">Both Boys</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brown-dark">
            What happened?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell the story of this moment..."
            className="w-full rounded-lg border border-cream-dark bg-cream/50 px-4 py-3 text-brown-dark placeholder:text-warm-gray/60 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brown-dark">
            Photos
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-amber");
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove("border-amber");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-amber");
              handleFiles(e.dataTransfer.files);
            }}
            className="cursor-pointer rounded-lg border-2 border-dashed border-cream-dark p-8 text-center transition-colors hover:border-amber/50"
          >
            <p className="text-warm-gray">
              Drop photos here or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {photos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="photo-frame relative">
                  <img
                    src={photo.preview}
                    alt=""
                    className="h-24 w-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-terracotta text-xs text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brown px-6 py-3 font-medium text-cream transition-colors hover:bg-brown-dark disabled:opacity-50"
        >
          {submitting ? "Saving memory..." : "Save Memory"}
        </button>
      </form>
    </div>
  );
}
