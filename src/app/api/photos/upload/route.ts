export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { uploadPhotoSchema } from "@/lib/validations";
import { uploadPhoto } from "@/lib/blob";
import { isAuthenticated } from "@/lib/auth-middleware";
import { eq, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = uploadPhotoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { entry_id, data, filename, content_type } = parsed.data;

  const [entry] = await db.select().from(entries).where(eq(entries.id, entry_id));
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const [maxOrder] = await db
    .select({ max: sql<number>`COALESCE(MAX(${photos.sortOrder}), -1)` })
    .from(photos)
    .where(eq(photos.entryId, entry_id));

  const { url, pathname } = await uploadPhoto({
    data,
    filename,
    contentType: content_type,
    child: entry.child,
    entryDate: entry.entryDate,
  });

  const [savedPhoto] = await db
    .insert(photos)
    .values({
      entryId: entry_id,
      blobUrl: url,
      blobPathname: pathname,
      sortOrder: Number(maxOrder.max) + 1,
    })
    .returning();

  return NextResponse.json(
    {
      id: savedPhoto.id,
      entry_id: savedPhoto.entryId,
      blob_url: savedPhoto.blobUrl,
      sort_order: savedPhoto.sortOrder,
    },
    { status: 201 }
  );
}
