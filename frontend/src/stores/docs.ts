import { defineStore } from "pinia";
import { http } from "../api/http";

export interface Doc {
  id: string; title: string; filename: string; status: string;
  total_chunks: number; upload_date: string; error?: string | null;
}

export const useDocs = defineStore("docs", {
  state: () => ({ list: [] as Doc[], loading: false }),
  actions: {
    async fetch() {
      this.loading = true;
      try { this.list = (await http.get("/documents")).data; }
      finally { this.loading = false; }
    },
    async upload(file: File, title: string) {
      const fd = new FormData();
      fd.append("file", file);
      if (title) fd.append("title", title);
      await http.post("/documents", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await this.fetch();
    },
    async remove(id: string) {
      await http.delete(`/documents/${id}`);
      this.list = this.list.filter((d) => d.id !== id);
    },
  },
});
