import { defineStore } from "pinia";
import { http } from "../api/http";

export interface Source { documentName: string; chunkId: string; pageNumber: number | null }
export interface Msg { id: string; role: "user" | "assistant" | "system"; content: string; sources?: any; created_at?: string }
export interface Conversation { id: string; title: string; created_at: string; updated_at: string }

export const useChat = defineStore("chat", {
  state: () => ({
    conversations: [] as Conversation[],
    current: null as (Conversation & { messages: Msg[] }) | null,
    sending: false,
  }),
  actions: {
    async fetchConversations() {
      this.conversations = (await http.get("/chat/conversations")).data;
    },
    async openConversation(id: string) {
      this.current = (await http.get(`/chat/conversations/${id}`)).data;
    },
    startNew() { this.current = null; },
    async ask(question: string) {
      this.sending = true;
      try {
        const { data } = await http.post("/chat/ask", {
          question,
          conversationId: this.current?.id ?? null,
        });
        if (!this.current || this.current.id !== data.conversationId) {
          await this.openConversation(data.conversationId);
        } else {
          await this.openConversation(this.current.id);
        }
        await this.fetchConversations();
        return data;
      } finally { this.sending = false; }
    },
    async deleteConversation(id: string) {
      await http.delete(`/chat/conversations/${id}`);
      this.conversations = this.conversations.filter((c) => c.id !== id);
      if (this.current?.id === id) this.current = null;
    },
  },
});
