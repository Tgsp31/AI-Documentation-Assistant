import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { useAuth } from "./stores/auth";

const routes: RouteRecordRaw[] = [
  { path: "/login", component: () => import("./pages/Login.vue"), meta: { guest: true } },
  { path: "/register", component: () => import("./pages/Register.vue"), meta: { guest: true } },
  {
    path: "/",
    component: () => import("./layouts/AppShell.vue"),
    meta: { auth: true },
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", component: () => import("./pages/Dashboard.vue") },
      { path: "documents", component: () => import("./pages/Documents.vue") },
      { path: "upload", component: () => import("./pages/Upload.vue"), meta: { roles: ["admin", "editor"] } },
      { path: "chat", component: () => import("./pages/Chat.vue") },
      { path: "search", component: () => import("./pages/Search.vue") },
      { path: "profile", component: () => import("./pages/Profile.vue") },
      { path: "admin", component: () => import("./pages/Admin.vue"), meta: { roles: ["admin"] } },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to) => {
  const auth = useAuth();
  if (to.meta.auth && !auth.isAuthenticated) return { path: "/login", query: { next: to.fullPath } };
  if (to.meta.guest && auth.isAuthenticated) return { path: "/dashboard" };
  const roles = (to.meta.roles as string[] | undefined);
  if (roles && (!auth.user || !roles.includes(auth.user.role))) return { path: "/dashboard" };
  return true;
});
