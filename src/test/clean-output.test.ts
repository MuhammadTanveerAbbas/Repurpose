import { describe, expect, it } from "vitest";
import { cleanGeneratedContent } from "@/lib/groq";

describe("cleanGeneratedContent", () => {
  it("strips markdown code fences", () => {
    expect(cleanGeneratedContent("```\nhello world\n```")).toBe("hello world");
    expect(cleanGeneratedContent("```markdown\n# Title\nbody text\n```")).toBe(
      "# Title\nbody text",
    );
  });

  it("strips AI preambles", () => {
    expect(
      cleanGeneratedContent("Here's your LinkedIn post:\n\nActual content here"),
    ).toBe("Actual content here");
    expect(cleanGeneratedContent("Sure! Here you go:\nReal post")).toBe(
      "Real post",
    );
  });

  it("unwraps quoted output", () => {
    expect(cleanGeneratedContent('"just the content"')).toBe(
      "just the content",
    );
    expect(cleanGeneratedContent("\u201Csmart quoted\u201D")).toBe(
      "smart quoted",
    );
  });

  it("leaves normal content untouched", () => {
    const text = "Line one\n\nLine two with \"inner quotes\" stays.";
    expect(cleanGeneratedContent(text)).toBe(text);
  });

  it("trims whitespace", () => {
    expect(cleanGeneratedContent("   padded   ")).toBe("padded");
  });
});
