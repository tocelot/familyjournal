import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, photos } from "@/db/schema";
import { createEntrySchema, listEntriesSchema } from "@/lib/validations";
import { uploadPhoto } from "@/lib/blob";
import { isAuthenticated } from "@/lib/auth-middleware";
import { eq, and, gte, lte, ilike, desc, asc, sql, or } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { child, description, entry_date, photos: photoInputs } = parsed.data;

  const [entry] = await db
    .insert(entries)
    .values({
      child,
      description,
      entryDate: entry_date,
    })
    .returning();

  const uploadedPhotos = [];
  if (photoInputs?.length) {
    for (let i = 0; i < photoInputs.length; i++) {
      const photo = photoInputs[i];
      const { url, pathname } = await uploadPhoto({
        data: photo.data,
        filename: photo.filename,
        contentType: photo.content_type,
        child,
        entryDate: entry_date,
      });

      const [savedPhoto] = await db
        .insert(photos)
        .values({
          entryId: entry.id,
          blobUrl: url,
          blobPathname: pathname,
          sortOrder: i,
        })
        .returning();

      uploadedPhotos.push({
        id: savedPhoto.id,
        blob_url: savedPhoto.blobUrl,
        sort_order: savedPhoto.sortOrder,
      });
    }
  }

  return NextResponse.json(
    {
      id: entry.id,
      child: entry.child,
      description: entry.description,
      entry_date: entry.entryDate,
      photos: uploadedPhotos,
      created_at: entry.createdAt,
    },
    { status: 201 }
  );
}

export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = listEntriesSchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { child, from, to, search, page, limit, sort } = parsed.data;

  const conditions = [
    child === "family"
      ? eq(entries.child, "family")
      : or(eq(entries.child, child), eq(entries.child, "family")),
  ];

  if (from) conditions.push(gte(entries.entryDate, from));
  if (to) conditions.push(lte(entries.entryDate, to));
  if (search) conditions.push(ilike(entries.description, `%${search}%`));

  const where = and(...conditions);
  const orderBy = sort === "newest" ? desc(entries.entryDate) : asc(entries.entryDate);
  const offset = (page - 1) * limit;

  const [entryRows, countResult] = await Promise.all([
    db
      .select()
      .from(entries)
      .where(where)
      .orderBy(orderBy, desc(entries.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(entries)
      .where(where),
  ]);

  const total = Number(countResult[0].count);

  const entryIds = entryRows.map((e) => e.id);
  const allPhotos =
    entryIds.length > 0
      ? await db
          .select()
          .from(photos)
          .where(sql`${photos.entryId} IN ${entryIds}`)
          .orderBy(asc(photos.sortOrder))
      : [];

  const photosByEntry = new Map<string, typeof allPhotos>();
  for (const photo of allPhotos) {
    const existing = photosByEntry.get(photo.entryId) || [];
    existing.push(photo);
    photosByEntry.set(photo.entryId, existing);
  }

  const responseEntries = entryRows.map((entry) => {
    const entryPhotos = photosByEntry.get(entry.id) || [];
    return {
      id: entry.id,
      child: entry.child,
      description: entry.description,
      entry_date: entry.entryDate,
      thumbnail_url: entryPhotos[0]?.blobUrl || null,
      photo_count: entryPhotos.length,
      created_at: entry.createdAt,
    };
  });

  return NextResponse.json({
    entries: responseEntries,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
}
