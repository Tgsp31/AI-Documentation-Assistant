export function cleanText(s: string) {
  return s.replace(/\r/g, "").replace(/[\t ]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Word-based chunker (~ chunkWords words per chunk with overlap). */
export function chunkText(text: string, chunkWords = 220, overlapWords = 40) {
  const words = text.split(/\s+/).filter(Boolean);
  const out: { content: string; index: number }[] = [];
  if (!words.length) return out;
  let i = 0, idx = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + chunkWords).join(" ");
    out.push({ content: slice, index: idx++ });
    if (i + chunkWords >= words.length) break;
    i += chunkWords - overlapWords;
  }
  return out;
}
