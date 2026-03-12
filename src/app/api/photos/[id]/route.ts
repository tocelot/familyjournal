import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { deletePhoto as deleteBlobPhoto } from "@/lib/blob";
import { requireSession } from "@/lib/auth-middleware";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await requireSession(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [photo] = await db.select().from(photos).where(eq(photos.id, id));
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await deleteBlobPhoto(photo.blobUrl).catch(() => {});

  await db.delete(photos).where(eq(photos.id, id));

  return NextResponse.json({ success: true });
}
