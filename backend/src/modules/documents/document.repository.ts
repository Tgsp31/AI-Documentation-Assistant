import { query } from "../../db/pool";

export interface DocRow {
  id: string;
  title: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string;
  upload_date: Date;
  status: "pending" | "processing" | "completed" | "failed";
  total_chunks: number;
  error: string | null;
}

export const documentRepo = {
  async create(d: Omit<DocRow, "id" | "upload_date" | "status" | "total_chunks" | "error">) {
    const r = await query(
      `INSERT INTO documents (title,filename,mime_type,size_bytes,storage_path,uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [d.title, d.filename, d.mime_type, d.size_bytes, d.storage_path, d.uploaded_by],
    );
    return r.rows[0] as DocRow;
  },
  async setStatus(id: string, status: DocRow["status"], totalChunks = 0, err: string | null = null) {
    await query(`UPDATE documents SET status=$2,total_chunks=$3,error=$4 WHERE id=$1`,
      [id, status, totalChunks, err]);
  },
  async findById(id: string) {
    const r = await query(`SELECT * FROM documents WHERE id=$1`, [id]);
    return (r.rows[0] as DocRow) ?? null;
  },
  async list(uploadedBy?: string) {
    const r = uploadedBy
      ? await query(`SELECT * FROM documents WHERE uploaded_by=$1 ORDER BY upload_date DESC`, [uploadedBy])
      : await query(`SELECT * FROM documents ORDER BY upload_date DESC`);
    return r.rows as DocRow[];
  },
  async delete(id: string) {
    await query(`DELETE FROM documents WHERE id=$1`, [id]);
  },
  async insertChunks(documentId: string, chunks: { index: number; page: number | null; content: string; tokens: number }[]) {
    if (!chunks.length) return [] as string[];
    const values: any[] = [];
    const placeholders = chunks.map((c, i) => {
      const o = i * 5;
      values.push(documentId, c.index, c.page, c.content, c.tokens);
      return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5})`;
    }).join(",");
    const r = await query(
      `INSERT INTO document_chunks (document_id,chunk_index,page_number,content,tokens)
       VALUES ${placeholders} RETURNING id, chunk_index`,
      values,
    );
    // map chunk_index -> id, preserve order
    const map = new Map<number, string>(r.rows.map((x: any) => [x.chunk_index, x.id]));
    return chunks.map((c) => map.get(c.index)!);
  },
  async chunkInfo(chunkIds: string[]) {
    if (!chunkIds.length) return [];
    const r = await query(
      `SELECT c.id, c.page_number, c.content, d.id AS document_id, d.title AS document_name
       FROM document_chunks c JOIN documents d ON d.id = c.document_id
       WHERE c.id = ANY($1::uuid[])`,
      [chunkIds],
    );
    return r.rows;
  },
  async keywordSearch(q: string, limit = 10) {
    const r = await query(
      `SELECT c.id, c.page_number, c.content, d.id AS document_id, d.title AS document_name,
              ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', $1)) AS rank
       FROM document_chunks c JOIN documents d ON d.id = c.document_id
       WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC LIMIT $2`,
      [q, limit],
    );
    return r.rows;
  },
};
