import { put, del } from "@vercel/blob";
import type { Child } from "./validations";

export async function uploadPhoto(options: {
  data: string;
  filename: string;
  contentType: string;
  child: Child;
  entryDate: string;
}): Promise<{ url: string; pathname: string }> {
  const { data, filename, contentType, child, entryDate } = options;
  const buffer = Buffer.from(data, "base64");

  const ext = filename.split(".").pop() || "jpg";
  const uniqueName = `${crypto.randomUUID()}.${ext}`;
  const pathname = `photos/${child}/${entryDate}/${uniqueName}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
  });

  return { url: blob.url, pathname };
}

export async function deletePhoto(blobUrl: string): Promise<void> {
  await del(blobUrl);
}
