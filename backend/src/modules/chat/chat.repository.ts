import { query } from "../../db/pool";

export const chatRepo = {
  async createConversation(userId: string, title: string) {
    const r = await query(
      `INSERT INTO conversations (user_id,title) VALUES ($1,$2) RETURNING id, title, created_at`,
      [userId, title],
    );
    return r.rows[0];
  },
  async listConversations(userId: string) {
    const r = await query(
      `SELECT id, title, created_at, updated_at FROM conversations
       WHERE user_id=$1 ORDER BY updated_at DESC`,
      [userId],
    );
    return r.rows;
  },
  async getConversation(id: string, userId: string) {
    const r = await query(`SELECT * FROM conversations WHERE id=$1 AND user_id=$2`, [id, userId]);
    return r.rows[0] ?? null;
  },
  async deleteConversation(id: string, userId: string) {
    await query(`DELETE FROM conversations WHERE id=$1 AND user_id=$2`, [id, userId]);
  },
  async listMessages(conversationId: string) {
    const r = await query(
      `SELECT id, role, content, sources, created_at FROM messages
       WHERE conversation_id=$1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return r.rows;
  },
  async addMessage(conversationId: string, role: "user" | "assistant" | "system", content: string, sources: any = null) {
    const r = await query(
      `INSERT INTO messages (conversation_id,role,content,sources) VALUES ($1,$2,$3,$4)
       RETURNING id, role, content, sources, created_at`,
      [conversationId, role, content, sources],
    );
    await query(`UPDATE conversations SET updated_at=NOW() WHERE id=$1`, [conversationId]);
    return r.rows[0];
  },
};
