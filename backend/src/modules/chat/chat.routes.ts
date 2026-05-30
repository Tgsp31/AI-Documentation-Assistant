import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../../middleware/auth";
import { chatLimiter } from "../../middleware/rateLimit";
import { wrap } from "../../utils/wrap";
import { chatRepo } from "./chat.repository";
import { chatService } from "./chat.service";

const r = Router();

const askSchema = z.object({
  question: z.string().min(1).max(2000),
  conversationId: z.string().uuid().nullable().optional(),
});

/**
 * @openapi
 * /chat/ask:
 *   post:
 *     tags: [Chat]
 *     summary: Ask a question (RAG)
 *     security: [{ bearerAuth: [] }]
 */
r.post("/ask", authRequired, chatLimiter, wrap(async (req, res) => {
  const body = askSchema.parse(req.body);
  res.json(await chatService.ask(req.user!.id, body.question, body.conversationId ?? null));
}));

/**
 * @openapi
 * /chat/conversations:
 *   get: { tags: [Chat], summary: "List my conversations", security: [{ bearerAuth: [] }] }
 */
r.get("/conversations", authRequired, wrap(async (req, res) => {
  res.json(await chatRepo.listConversations(req.user!.id));
}));

/**
 * @openapi
 * /chat/conversations/{id}:
 *   get: { tags: [Chat], summary: "Get conversation messages", security: [{ bearerAuth: [] }] }
 */
r.get("/conversations/:id", authRequired, wrap(async (req, res) => {
  const convo = await chatRepo.getConversation(req.params.id, req.user!.id);
  if (!convo) return res.status(404).end();
  const messages = await chatRepo.listMessages(convo.id);
  res.json({ ...convo, messages });
}));

/**
 * @openapi
 * /chat/conversations/{id}:
 *   delete: { tags: [Chat], summary: "Delete conversation", security: [{ bearerAuth: [] }] }
 */
r.delete("/conversations/:id", authRequired, wrap(async (req, res) => {
  await chatRepo.deleteConversation(req.params.id, req.user!.id);
  res.status(204).end();
}));

export default r;
