import { query } from "../../db/pool";
import { HttpError } from "../../middleware/error";
import { querySimilar } from "../../services/chroma";
import { embedTexts, generateAnswer } from "../../services/gemini";
import { documentRepo } from "../documents/document.repository";
import { chatRepo } from "./chat.repository";

export const chatService = {
  async ask(userId: string, question: string, conversationId: string | null) {
    const start = Date.now();
    // ensure conversation
    let convo = conversationId
      ? await chatRepo.getConversation(conversationId, userId)
      : null;
    if (!convo) {
      convo = await chatRepo.createConversation(userId, question.slice(0, 60));
    } else if (conversationId && !convo) {
      throw new HttpError(404, "Conversation not found");
    }

    await chatRepo.addMessage(convo.id, "user", question);

    const [embedding] = await embedTexts([question]);
    const hits = await querySimilar(embedding, 5);

    // hydrate from DB to ensure latest document title
    const ids = hits.map((h) => h.id);
    const rows = await documentRepo.chunkInfo(ids);
    const byId = new Map(rows.map((r: any) => [r.id, r]));
    const contexts = hits
      .map((h) => {
        const row = byId.get(h.id);
        if (!row) return null;
        return {
          id: h.id,
          documentName: row.document_name,
          pageNumber: row.page_number,
          content: row.content,
          score: h.score,
        };
      })
      .filter(Boolean) as any[];

    const answer = await generateAnswer(question, contexts);
    const msg = await chatRepo.addMessage(convo.id, "assistant", answer.answer, answer);

    await query(`INSERT INTO metrics_events (kind,duration_ms) VALUES ('chat_answer',$1)`, [Date.now() - start]);

    return {
      conversationId: convo.id,
      messageId: msg.id,
      ...answer,
    };
  },
};
