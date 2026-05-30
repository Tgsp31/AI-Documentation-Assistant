import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!genAI) {
    logger.warn("GEMINI_API_KEY not set — returning zero-vector embeddings");
    return texts.map(() => new Array(768).fill(0));
  }
  const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBED_MODEL });
  const out: number[][] = [];
  for (const t of texts) {
    const r = await model.embedContent(t);
    out.push(r.embedding.values);
  }
  return out;
}

export interface ChatSource { documentName: string; chunkId: string; pageNumber: number | null }
export interface ChatAnswer { answer: string; confidence: "low" | "medium" | "high"; sources: ChatSource[] }

export async function generateAnswer(
  question: string,
  contexts: { id: string; documentName: string; pageNumber: number | null; content: string; score: number }[],
): Promise<ChatAnswer> {
  const sources: ChatSource[] = contexts.map((c) => ({
    documentName: c.documentName,
    chunkId: c.id,
    pageNumber: c.pageNumber,
  }));

  if (!genAI || contexts.length === 0) {
    return {
      answer: contexts.length === 0
        ? "I could not find any relevant context in the uploaded documents to answer that."
        : "AI is not configured. Returning retrieved context only.",
      confidence: "low",
      sources,
    };
  }

  const contextBlock = contexts
    .map((c, i) => `[#${i + 1} | ${c.documentName} p.${c.pageNumber ?? "?"}]\n${c.content}`)
    .join("\n\n");

  const prompt = `You are an internal-documentation assistant. Use ONLY the context below to answer the question. If the answer is not in the context, say you don't know. Cite sources inline as [#1], [#2], etc.

CONTEXT:
${contextBlock}

QUESTION: ${question}

Answer:`;

  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  const r = await model.generateContent(prompt);
  const text = r.response.text();
  const avg = contexts.reduce((a, c) => a + c.score, 0) / contexts.length;
  const confidence: ChatAnswer["confidence"] = avg > 0.8 ? "high" : avg > 0.6 ? "medium" : "low";
  return { answer: text, confidence, sources };
}
