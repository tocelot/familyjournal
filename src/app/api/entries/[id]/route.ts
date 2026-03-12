import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { updateEntrySchema } from "@/lib/validations";
import { deletePhoto as deleteBlobPhoto } from "@/lib/blob";
import { requireSession } from "@/lib/auth-middleware";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await requireSession(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [entry] = await db.select().from(entries).where(eq(entries.id, id));
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const entryPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.entryId, id))
    .orderBy(asc(photos.sortOrder));

  return NextResponse.json({
    id: entry.id,
    child: entry.child,
    description: entry.description,
    entry_date: entry.entryDate,
    photos: entryPhotos.map((p) => ({
      id: p.id,
      blob_url: p.blobUrl,
      sort_order: p.sortOrder,
    })),
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await requireSession(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.entry_date !== undefined) updates.entryDate = parsed.data.entry_date;
  if (parsed.data.child !== undefined) updates.child = parsed.data.child;

  const [updated] = await db
    .update(entries)
    .set(updates)
    .where(eq(entries.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: updated.id,
    child: updated.child,
    description: updated.description,
    entry_date: updated.entryDate,
    updated_at: updated.updatedAt,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await requireSession(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const entryPhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.entryId, id));

  for (const photo of entryPhotos) {
    await deleteBlobPhoto(photo.blobUrl).catch(() => {});
  }

  const [deleted] = await db
    .delete(entries)
    .where(eq(entries.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
