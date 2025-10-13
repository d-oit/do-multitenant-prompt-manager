import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (className utility)", () => {
  it("merges multiple class names", () => {
    const result = cn("class1", "class2", "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("filters out falsy values", () => {
    const result = cn("class1", false, null, undefined, "", "class2");
    expect(result).toBe("class1 class2");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    
    const result = cn(
      "base-class",
      isActive && "active",
      isDisabled && "disabled"
    );
    
    expect(result).toBe("base-class active");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles single class", () => {
    const result = cn("single");
    expect(result).toBe("single");
  });

  it("handles arrays of classes", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toContain("class1");
    expect(result).toContain("class2");
    expect(result).toContain("class3");
  });

  it("removes duplicate classes", () => {
    const result = cn("duplicate", "other", "duplicate");
    // Should not have duplicates
    const classes = result.split(" ");
    const uniqueClasses = [...new Set(classes)];
    expect(classes.length).toBe(uniqueClasses.length);
  });

  it("trims whitespace", () => {
    const result = cn("  class1  ", "  class2  ");
    expect(result).not.toMatch(/^\s+/);
    expect(result).not.toMatch(/\s+$/);
  });
});
