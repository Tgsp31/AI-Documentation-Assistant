import { Router } from "express";
import { authRequired, requireRole } from "../../middleware/auth";
import { wrap } from "../../utils/wrap";
import { query } from "../../db/pool";
import { userRepo } from "../auth/auth.repository";
import { documentRepo } from "../documents/document.repository";

const r = Router();
r.use(authRequired, requireRole("admin"));

/**
 * @openapi
 * /admin/users:
 *   get: { tags: [Admin], summary: "List all users", security: [{ bearerAuth: [] }] }
 */
r.get("/users", wrap(async (_req, res) => res.json(await userRepo.listAll())));

/**
 * @openapi
 * /admin/documents:
 *   get: { tags: [Admin], summary: "List all documents", security: [{ bearerAuth: [] }] }
 */
r.get("/documents", wrap(async (_req, res) => res.json(await documentRepo.list())));

/**
 * @openapi
 * /admin/metrics:
 *   get: { tags: [Admin], summary: "System metrics", security: [{ bearerAuth: [] }] }
 */
r.get("/metrics", wrap(async (_req, res) => {
  const [users, docs, chats, avg, byStatus] = await Promise.all([
    query(`SELECT COUNT(*)::int AS n FROM users`),
    query(`SELECT COUNT(*)::int AS n FROM documents`),
    query(`SELECT COUNT(*)::int AS n FROM conversations`),
    query(`SELECT COALESCE(AVG(duration_ms),0)::int AS ms FROM metrics_events WHERE kind='chat_answer'`),
    query(`SELECT status, COUNT(*)::int AS n FROM documents GROUP BY status`),
  ]);
  res.json({
    totalUsers: users.rows[0].n,
    totalDocuments: docs.rows[0].n,
    totalChats: chats.rows[0].n,
    averageResponseTimeMs: avg.rows[0].ms,
    documentsByStatus: Object.fromEntries(byStatus.rows.map((r: any) => [r.status, r.n])),
  });
}));

export default r;
