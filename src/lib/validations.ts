import { z } from "zod/v4";

export const childValues = ["asher", "aiden", "family"] as const;
export type Child = (typeof childValues)[number];

const mediaInputSchema = z.object({
  data: z.string().min(1, "Media data is required"),
  filename: z.string().min(1, "Filename is required"),
  content_type: z.string().regex(/^(image|video)\//, "Must be an image or video content type"),
});

export const createEntrySchema = z.object({
  child: z.enum(childValues),
  description: z.string().default(""),
  entry_date: z.iso.date("Must be a valid ISO date (YYYY-MM-DD)"),
  photos: z.array(mediaInputSchema).optional(),
});

export const updateEntrySchema = z.object({
  description: z.string().optional(),
  entry_date: z.iso.date("Must be a valid ISO date (YYYY-MM-DD)").optional(),
  child: z.enum(childValues).optional(),
});

export const uploadPhotoSchema = z.object({
  entry_id: z.uuid("Must be a valid UUID"),
  data: z.string().min(1, "Media data is required"),
  filename: z.string().min(1, "Filename is required"),
  content_type: z.string().regex(/^(image|video)\//, "Must be an image or video content type"),
});

export const listEntriesSchema = z.object({
  child: z.enum(childValues),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;
export type ListEntriesInput = z.infer<typeof listEntriesSchema>;
