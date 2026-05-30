import axios, { AxiosError, AxiosRequestConfig } from "axios";

declare const __API_URL__: string;
const baseURL = (typeof __API_URL__ !== "undefined" && __API_URL__) || "/api";

export const http = axios.create({ baseURL });

let accessToken: string | null = localStorage.getItem("accessToken");
let refreshToken: string | null = localStorage.getItem("refreshToken");

export function setTokens(a: string | null, r: string | null) {
  accessToken = a; refreshToken = r;
  if (a) localStorage.setItem("accessToken", a); else localStorage.removeItem("accessToken");
  if (r) localStorage.setItem("refreshToken", r); else localStorage.removeItem("refreshToken");
}
export const getAccessToken = () => accessToken;

http.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;
async function tryRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  if (!refreshing) {
    refreshing = axios.post(`${baseURL}/auth/refresh`, { refreshToken })
      .then((r) => {
        setTokens(r.data.accessToken, r.data.refreshToken);
        return r.data.accessToken as string;
      })
      .catch(() => { setTokens(null, null); return null; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

http.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const cfg = err.config as AxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !cfg._retry && refreshToken && !cfg.url?.includes("/auth/")) {
      cfg._retry = true;
      const t = await tryRefresh();
      if (t) {
        cfg.headers = { ...(cfg.headers ?? {}), Authorization: `Bearer ${t}` };
        return http.request(cfg);
      }
    }
    return Promise.reject(err);
  },
);
