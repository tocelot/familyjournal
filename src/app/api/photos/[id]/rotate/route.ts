export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { requireSession } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import sharp from "sharp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await requireSession(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Find the photo
  const [photo] = await db.select().from(photos).where(eq(photos.id, id));
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  try {
    // Download the current image from blob storage
    const imageResponse = await fetch(photo.blobUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Rotate 90° clockwise using sharp
    const rotatedBuffer = await sharp(imageBuffer)
      .rotate(90)
      .toBuffer();

    // Upload the rotated image to a new blob path
    const ext = photo.blobPathname.split(".").pop() || "jpg";
    const newPathname = photo.blobPathname.replace(`.${ext}`, `-r${Date.now()}.${ext}`);

    const blob = await put(newPathname, rotatedBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    // Delete the old blob
    await del(photo.blobUrl).catch(() => {});

    // Update DB with new URL and pathname
    const [updated] = await db
      .update(photos)
      .set({
        blobUrl: blob.url,
        blobPathname: newPathname,
      })
      .where(eq(photos.id, id))
      .returning();

    return NextResponse.json({
      id: updated.id,
      blob_url: updated.blobUrl,
      sort_order: updated.sortOrder,
    });
  } catch (err) {
    console.error("Photo rotation error:", err);
    return NextResponse.json({ error: "Failed to rotate photo" }, { status: 500 });
  }
}
