import fs from "fs/promises";
import { Worker } from "bullmq";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { logger } from "../utils/logger";
import { redis } from "../services/queue";
import { documentRepo } from "../modules/documents/document.repository";
import { embedTexts } from "../services/gemini";
import { upsertChunks } from "../services/chroma";
import { chunkText, cleanText } from "../utils/text";
import { query } from "../db/pool";

async function extract(doc: { mime_type: string; storage_path: string }): Promise<{ text: string; pages: number }> {
  const buf = await fs.readFile(doc.storage_path);
  if (doc.mime_type === "application/pdf") {
    const r = await pdfParse(buf);
    return { text: r.text, pages: r.numpages };
  }
  if (doc.mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const r = await mammoth.extractRawText({ buffer: buf });
    return { text: r.value, pages: 1 };
  }
  return { text: buf.toString("utf-8"), pages: 1 };
}

export function startDocumentWorker() {
  const worker = new Worker(
    "document-processing",
    async (job) => {
      const start = Date.now();
      const { documentId } = job.data as { documentId: string };
      const doc = await documentRepo.findById(documentId);
      if (!doc) throw new Error("document missing");
      await documentRepo.setStatus(doc.id, "processing");
      try {
        const { text, pages } = await extract(doc);
        const cleaned = cleanText(text);
        const pieces = chunkText(cleaned);
        if (!pieces.length) {
          await documentRepo.setStatus(doc.id, "completed", 0);
          return;
        }
        // Approximate page mapping: spread chunks evenly across pages.
        const chunksForDb = pieces.map((p) => ({
          index: p.index,
          page: Math.min(pages, Math.floor((p.index / pieces.length) * pages) + 1),
          content: p.content,
          tokens: p.content.split(/\s+/).length,
        }));
        const ids = await documentRepo.insertChunks(doc.id, chunksForDb);
        const embeddings = await embedTexts(chunksForDb.map((c) => c.content));
        await upsertChunks(ids.map((id, i) => ({
          id,
          embedding: embeddings[i],
          content: chunksForDb[i].content,
          metadata: {
            documentId: doc.id,
            documentName: doc.title,
            chunkIndex: chunksForDb[i].index,
            pageNumber: chunksForDb[i].page,
          },
        })));
        await documentRepo.setStatus(doc.id, "completed", chunksForDb.length);
        await query(`INSERT INTO metrics_events (kind,duration_ms) VALUES ('doc_processed',$1)`, [Date.now() - start]);
      } catch (err: any) {
        logger.error({ err, documentId }, "Document processing failed");
        await documentRepo.setStatus(doc.id, "failed", 0, String(err?.message ?? err));
        throw err;
      }
    },
    { connection: redis, concurrency: 2 },
  );

  worker.on("failed", (job, err) => logger.error({ job: job?.id, err }, "Job failed"));
  worker.on("completed", (job) => logger.info({ job: job.id }, "Job completed"));
  return worker;
}
