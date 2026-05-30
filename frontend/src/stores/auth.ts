import { defineStore } from "pinia";
import { http, setTokens, getAccessToken } from "../api/http";

export interface AuthUser { id: string; email: string; role: "admin" | "editor" | "viewer"; fullName?: string }

export const useAuth = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (s) => !!s.user,
    isAdmin: (s) => s.user?.role === "admin",
    canUpload: (s) => s.user?.role === "admin" || s.user?.role === "editor",
  },
  actions: {
    async hydrate() {
      if (getAccessToken()) {
        try {
          const me = await http.get("/auth/me");
          this.user = me.data;
        } catch { setTokens(null, null); }
      }
      this.ready = true;
    },
    async login(email: string, password: string) {
      const { data } = await http.post("/auth/login", { email, password });
      setTokens(data.accessToken, data.refreshToken);
      this.user = data.user;
    },
    async register(email: string, password: string, fullName: string) {
      const { data } = await http.post("/auth/register", { email, password, fullName });
      setTokens(data.accessToken, data.refreshToken);
      this.user = data.user;
    },
    async logout() {
      const r = localStorage.getItem("refreshToken");
      try { if (r) await http.post("/auth/logout", { refreshToken: r }); } catch { /* ignore */ }
      setTokens(null, null);
      this.user = null;
    },
  },
});
