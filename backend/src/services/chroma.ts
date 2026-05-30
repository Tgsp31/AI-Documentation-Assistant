import { ChromaClient, Collection } from "chromadb";
import { env } from "../config/env";

const client = new ChromaClient({ path: env.CHROMA_URL });
const COLLECTION = "documents";

let collectionPromise: Promise<Collection> | null = null;

export function getCollection() {
  if (!collectionPromise) {
    // Disable Chroma's built-in embedder; we provide our own vectors.
    collectionPromise = client.getOrCreateCollection({
      name: COLLECTION,
      embeddingFunction: { generate: async (texts) => texts.map(() => []) },
    });
  }
  return collectionPromise;
}

export interface ChunkRecord {
  id: string;
  embedding: number[];
  content: string;
  metadata: { documentId: string; documentName: string; chunkIndex: number; pageNumber: number | null };
}

export async function upsertChunks(records: ChunkRecord[]) {
  if (!records.length) return;
  const col = await getCollection();
  await col.upsert({
    ids: records.map((r) => r.id),
    embeddings: records.map((r) => r.embedding),
    documents: records.map((r) => r.content),
    metadatas: records.map((r) => r.metadata as any),
  });
}

export async function querySimilar(embedding: number[], k = 5, documentIds?: string[]) {
  const col = await getCollection();
  const res = await col.query({
    queryEmbeddings: [embedding],
    nResults: k,
    where: documentIds?.length ? { documentId: { $in: documentIds } } : undefined,
  });
  const ids = res.ids?.[0] ?? [];
  const docs = res.documents?.[0] ?? [];
  const metas = res.metadatas?.[0] ?? [];
  const dists = res.distances?.[0] ?? [];
  return ids.map((id, i) => ({
    id: id as string,
    content: (docs[i] as string) ?? "",
    metadata: metas[i] as any,
    score: 1 - (dists[i] ?? 1), // cosine distance -> similarity
  }));
}

export async function deleteByDocument(documentId: string) {
  const col = await getCollection();
  await col.delete({ where: { documentId } });
}
