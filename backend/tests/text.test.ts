import { chunkText, cleanText } from "../src/utils/text";

describe("text utils", () => {
  it("cleans whitespace", () => {
    expect(cleanText("a\r\nb\n\n\n\nc")).toBe("a\nb\n\nc");
  });
  it("chunks with overlap", () => {
    const words = Array.from({ length: 500 }, (_, i) => `w${i}`).join(" ");
    const chunks = chunkText(words, 100, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content.split(" ").length).toBeLessThanOrEqual(100);
  });
  it("returns nothing for empty", () => {
    expect(chunkText("")).toEqual([]);
  });
});
