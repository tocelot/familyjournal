import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth-middleware";
import { eq, inArray, asc } from "drizzle-orm";
import { z } from "zod";

const mergeSchema = z.object({
  targetId: z.string().uuid(),
  sourceIds: z.array(z.string().uuid()).min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { targetId, sourceIds, description } = parsed.data;

  // Verify target exists
  const [target] = await db.select().from(entries).where(eq(entries.id, targetId));
  if (!target) {
    return NextResponse.json({ error: "Target entry not found" }, { status: 404 });
  }

  // Get current max sort_order on target
  const targetPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.entryId, targetId))
    .orderBy(asc(photos.sortOrder));
  
  let nextSort = targetPhotos.length > 0 
    ? Math.max(...targetPhotos.map(p => p.sortOrder)) + 1 
    : targetPhotos.length;

  // Move photos from each source to target
  for (const sourceId of sourceIds) {
    const sourcePhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.entryId, sourceId))
      .orderBy(asc(photos.sortOrder));

    for (const photo of sourcePhotos) {
      await db
        .update(photos)
        .set({ entryId: targetId, sortOrder: nextSort++ })
        .where(eq(photos.id, photo.id));
    }

    // Delete the now-empty source entry
    await db.delete(entries).where(eq(entries.id, sourceId));
  }

  // Update description if provided
  if (description !== undefined) {
    await db
      .update(entries)
      .set({ description, updatedAt: new Date() })
      .where(eq(entries.id, targetId));
  }

  // Return updated entry
  const [updated] = await db.select().from(entries).where(eq(entries.id, targetId));
  const updatedPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.entryId, targetId))
    .orderBy(asc(photos.sortOrder));

  return NextResponse.json({
    id: updated.id,
    child: updated.child,
    description: updated.description,
    entry_date: updated.entryDate,
    photo_count: updatedPhotos.length,
    photos: updatedPhotos.map(p => ({
      id: p.id,
      blob_url: p.blobUrl,
      media_type: p.mediaType,
      sort_order: p.sortOrder,
    })),
  });
}
