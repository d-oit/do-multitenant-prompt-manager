import { describe, it, expect } from "vitest";
import { serializeMetadata } from "./api";

describe("serializeMetadata", () => {
  it("serializes object to formatted JSON string", () => {
    const metadata = { key: "value", nested: { prop: 123 } };
    const result = serializeMetadata(metadata);

    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
    expect(result).toContain('"nested"');
  });

  it("returns empty string for null", () => {
    expect(serializeMetadata(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(serializeMetadata(undefined)).toBe("");
  });

  it("handles empty object", () => {
    expect(serializeMetadata({})).toBe("{}");
  });

  it("handles arrays", () => {
    const metadata = { tags: ["one", "two", "three"] };
    const result = serializeMetadata(metadata);
    expect(result).toContain("tags");
    expect(result).toContain("one");
  });

  it("handles nested objects", () => {
    const metadata = {
      level1: {
        level2: {
          level3: "deep"
        }
      }
    };
    const result = serializeMetadata(metadata);
    expect(result).toContain("level1");
    expect(result).toContain("level3");
  });
});
