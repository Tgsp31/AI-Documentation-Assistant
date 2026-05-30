<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item :title="auth.user?.email" :subtitle="auth.user?.role" />
      <v-divider />
      <v-list nav density="compact">
        <v-list-item v-for="i in items" :key="i.to" :to="i.to" :title="i.title" :prepend-icon="i.icon" />
      </v-list>
      <template #append>
        <div class="pa-2">
          <v-btn block variant="tonal" color="error" @click="logout">Logout</v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar flat>
      <v-app-bar-title>AI Documentation Assistant</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../stores/auth";

const auth = useAuth();
const router = useRouter();

const items = computed(() => {
  const base = [
    { to: "/dashboard", title: "Dashboard", icon: "mdi-view-dashboard" },
    { to: "/documents", title: "Documents", icon: "mdi-file-document-multiple" },
    { to: "/chat", title: "Chat Assistant", icon: "mdi-robot" },
    { to: "/search", title: "Search", icon: "mdi-magnify" },
    { to: "/profile", title: "Profile", icon: "mdi-account" },
  ];
  if (auth.canUpload) base.splice(2, 0, { to: "/upload", title: "Upload", icon: "mdi-upload" });
  if (auth.isAdmin) base.push({ to: "/admin", title: "Admin", icon: "mdi-shield-crown" });
  return base;
});

async function logout() {
  await auth.logout();
  router.push("/login");
}
</script>
