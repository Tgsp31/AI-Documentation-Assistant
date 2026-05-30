import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { env } from "../../config/env";
import { authRequired, requireRole } from "../../middleware/auth";
import { wrap } from "../../utils/wrap";
import { documentService, ensureUploadDir, uploadDir } from "./document.service";

const r = Router();

ensureUploadDir().catch(() => {});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
});

/**
 * @openapi
 * /documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a document (PDF/DOCX/TXT)
 *     security: [{ bearerAuth: [] }]
 */
r.post("/",
  authRequired,
  requireRole("admin", "editor"),
  upload.single("file"),
  wrap(async (req, res) => {
    const title = z.string().max(200).optional().parse(req.body?.title);
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const doc = await documentService.upload(req.file, title ?? "", req.user!.id);
    res.status(201).json(doc);
  }),
);

/**
 * @openapi
 * /documents:
 *   get: { tags: [Documents], summary: "List documents", security: [{ bearerAuth: [] }] }
 */
r.get("/", authRequired, wrap(async (req, res) => {
  const list = req.user!.role === "admin"
    ? await documentService.list()
    : await documentService.list(req.user!.id);
  res.json(list);
}));

/**
 * @openapi
 * /documents/{id}:
 *   get: { tags: [Documents], summary: "Get document by id", security: [{ bearerAuth: [] }] }
 */
r.get("/:id", authRequired, wrap(async (req, res) => {
  res.json(await documentService.get(req.params.id, req.user!));
}));

/**
 * @openapi
 * /documents/{id}:
 *   delete: { tags: [Documents], summary: "Delete document", security: [{ bearerAuth: [] }] }
 */
r.delete("/:id",
  authRequired,
  requireRole("admin", "editor"),
  wrap(async (req, res) => {
    await documentService.remove(req.params.id, req.user!);
    res.status(204).end();
  }),
);

export default r;
