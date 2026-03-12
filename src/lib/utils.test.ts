import { describe, it, expect } from "vitest";
import { formatDate, truncate, childLabel } from "./utils";

describe("formatDate", () => {
  it("formats a date string as a readable date", () => {
    const result = formatDate("2026-03-11");
    expect(result).toBe("Wednesday, March 11, 2026");
  });

  it("handles different dates correctly", () => {
    const result = formatDate("2026-01-01");
    expect(result).toBe("Thursday, January 1, 2026");
  });
});

describe("truncate", () => {
  it("returns the full string if shorter than max", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncate("This is a long description that should be truncated", 20)).toBe(
      "This is a long descr..."
    );
  });

  it("returns the full string if exactly max length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});

describe("childLabel", () => {
  it("returns the correct label for each child", () => {
    expect(childLabel("asher")).toBe("Asher's Journal");
    expect(childLabel("aiden")).toBe("Aiden's Journal");
    expect(childLabel("family")).toBe("Family Journal");
  });

  it("returns a generic label for unknown values", () => {
    expect(childLabel("unknown")).toBe("Journal");
  });
});
