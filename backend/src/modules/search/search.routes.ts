import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../../middleware/auth";
import { wrap } from "../../utils/wrap";
import { querySimilar } from "../../services/chroma";
import { embedTexts } from "../../services/gemini";
import { documentRepo } from "../documents/document.repository";

const r = Router();

const qSchema = z.object({
  q: z.string().min(1).max(500),
  mode: z.enum(["semantic", "keyword", "hybrid"]).default("hybrid"),
  k: z.coerce.number().int().min(1).max(20).default(10),
});

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search document chunks (semantic / keyword / hybrid)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: mode
 *         schema: { type: string, enum: [semantic, keyword, hybrid] }
 *       - in: query
 *         name: k
 *         schema: { type: integer }
 */
r.get("/", authRequired, wrap(async (req, res) => {
  const { q, mode, k } = qSchema.parse(req.query);

  let semantic: { id: string; score: number }[] = [];
  let keyword: { id: string; score: number }[] = [];

  if (mode === "semantic" || mode === "hybrid") {
    const [emb] = await embedTexts([q]);
    semantic = (await querySimilar(emb, k)).map((h) => ({ id: h.id, score: h.score }));
  }
  if (mode === "keyword" || mode === "hybrid") {
    const rows = await documentRepo.keywordSearch(q, k);
    keyword = rows.map((r: any) => ({ id: r.id, score: Number(r.rank) }));
  }

  let merged: { id: string; score: number }[];
  if (mode === "semantic") merged = semantic;
  else if (mode === "keyword") merged = keyword;
  else {
    // Reciprocal Rank Fusion
    const rrf: Record<string, number> = {};
    const C = 60;
    semantic.forEach((h, i) => { rrf[h.id] = (rrf[h.id] ?? 0) + 1 / (C + i); });
    keyword.forEach((h, i) => { rrf[h.id] = (rrf[h.id] ?? 0) + 1 / (C + i); });
    merged = Object.entries(rrf)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([id, score]) => ({ id, score }));
  }

  const rows = await documentRepo.chunkInfo(merged.map((m) => m.id));
  const byId = new Map<string, any>(rows.map((r: any) => [r.id, r]));
  const results = merged
    .map((m) => {
      const row = byId.get(m.id);
      if (!row) return null;
      return {
        chunkId: row.id,
        documentId: row.document_id,
        documentName: row.document_name,
        pageNumber: row.page_number,
        snippet: row.content.slice(0, 400),
        score: m.score,
      };
    })
    .filter(Boolean);
  res.json({ mode, query: q, results });
}));

export default r;
