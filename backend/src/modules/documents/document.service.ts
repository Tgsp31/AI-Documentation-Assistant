import fs from "fs/promises";
import path from "path";
import { env } from "../../config/env";
import { HttpError } from "../../middleware/error";
import { documentQueue } from "../../services/queue";
import { deleteByDocument } from "../../services/chroma";
import { documentRepo, DocRow } from "./document.repository";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export const documentService = {
  async upload(file: Express.Multer.File, title: string, userId: string) {
    if (!ALLOWED.has(file.mimetype)) throw new HttpError(415, "Unsupported file type");
    const doc = await documentRepo.create({
      title: title || file.originalname,
      filename: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      storage_path: file.path,
      uploaded_by: userId,
    });
    await documentQueue.add("process", { documentId: doc.id }, {
      removeOnComplete: true, removeOnFail: false, attempts: 2,
    });
    return doc;
  },

  async list(userId?: string) { return documentRepo.list(userId); },

  async get(id: string, user: { id: string; role: string }) {
    const d = await documentRepo.findById(id);
    if (!d) throw new HttpError(404, "Document not found");
    if (user.role !== "admin" && d.uploaded_by !== user.id) throw new HttpError(403, "Forbidden");
    return d;
  },

  async remove(id: string, user: { id: string; role: string }) {
    const d = await this.get(id, user);
    await deleteByDocument(d.id);
    try { await fs.unlink(d.storage_path); } catch { /* ignore */ }
    await documentRepo.delete(d.id);
  },
};

export const uploadDir = path.resolve(env.UPLOAD_DIR);
export async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

export type DocumentDTO = DocRow;
