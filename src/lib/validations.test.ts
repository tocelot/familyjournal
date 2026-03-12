import { describe, it, expect } from "vitest";
import {
  createEntrySchema,
  updateEntrySchema,
  uploadPhotoSchema,
  listEntriesSchema,
} from "./validations";

describe("createEntrySchema", () => {
  it("accepts a valid entry with photos", () => {
    const result = createEntrySchema.safeParse({
      child: "asher",
      description: "Asher drew a dragon in art class",
      entry_date: "2026-03-11",
      photos: [
        {
          data: "base64data",
          filename: "photo.jpg",
          content_type: "image/jpeg",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid entry without photos", () => {
    const result = createEntrySchema.safeParse({
      child: "aiden",
      description: "Aiden said his first full sentence today",
      entry_date: "2026-03-10",
    });
    expect(result.success).toBe(true);
  });

  it("defaults description to empty string", () => {
    const result = createEntrySchema.safeParse({
      child: "family",
      entry_date: "2026-03-11",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("");
    }
  });

  it("rejects invalid child value", () => {
    const result = createEntrySchema.safeParse({
      child: "bob",
      description: "test",
      entry_date: "2026-03-11",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const result = createEntrySchema.safeParse({
      child: "asher",
      description: "test",
      entry_date: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-image content type in photos", () => {
    const result = createEntrySchema.safeParse({
      child: "asher",
      description: "test",
      entry_date: "2026-03-11",
      photos: [
        {
          data: "base64data",
          filename: "file.pdf",
          content_type: "application/pdf",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEntrySchema", () => {
  it("accepts partial updates", () => {
    const result = updateEntrySchema.safeParse({
      description: "Updated description",
    });
    expect(result.success).toBe(true);
  });

  it("accepts changing child assignment", () => {
    const result = updateEntrySchema.safeParse({
      child: "family",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (no changes)", () => {
    const result = updateEntrySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid child value", () => {
    const result = updateEntrySchema.safeParse({
      child: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("uploadPhotoSchema", () => {
  it("accepts valid photo upload", () => {
    const result = uploadPhotoSchema.safeParse({
      entry_id: "550e8400-e29b-41d4-a716-446655440000",
      data: "base64data",
      filename: "photo.jpg",
      content_type: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for entry_id", () => {
    const result = uploadPhotoSchema.safeParse({
      entry_id: "not-a-uuid",
      data: "base64data",
      filename: "photo.jpg",
      content_type: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty data", () => {
    const result = uploadPhotoSchema.safeParse({
      entry_id: "550e8400-e29b-41d4-a716-446655440000",
      data: "",
      filename: "photo.jpg",
      content_type: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });
});

describe("listEntriesSchema", () => {
  it("accepts minimal query with defaults", () => {
    const result = listEntriesSchema.safeParse({
      child: "asher",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("accepts full query with all filters", () => {
    const result = listEntriesSchema.safeParse({
      child: "aiden",
      from: "2026-01-01",
      to: "2026-03-31",
      search: "dragon",
      page: 2,
      limit: 10,
      sort: "oldest",
    });
    expect(result.success).toBe(true);
  });

  it("coerces string numbers for page and limit", () => {
    const result = listEntriesSchema.safeParse({
      child: "family",
      page: "3",
      limit: "15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(15);
    }
  });

  it("rejects limit above 50", () => {
    const result = listEntriesSchema.safeParse({
      child: "asher",
      limit: 100,
    });
    expect(result.success).toBe(false);
  });
});
