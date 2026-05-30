<template>
  <v-row>
    <v-col cols="12" md="3" v-for="card in cards" :key="card.label">
      <v-card>
        <v-card-text>
          <div class="text-overline">{{ card.label }}</div>
          <div class="text-h4">{{ card.value }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-card class="mt-6">
    <v-card-title>Users</v-card-title>
    <v-data-table :items="users" :headers="userHeaders" items-per-page="20" />
  </v-card>

  <v-card class="mt-6">
    <v-card-title>All documents</v-card-title>
    <v-data-table :items="docs" :headers="docHeaders" items-per-page="20">
      <template #item.status="{ item }">
        <v-chip size="small" :color="statusColor(item.status)">{{ item.status }}</v-chip>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { http } from "../api/http";

const metrics = ref<any>({});
const users = ref<any[]>([]); const docs = ref<any[]>([]);

const cards = computed(() => [
  { label: "Users", value: metrics.value.totalUsers ?? "—" },
  { label: "Documents", value: metrics.value.totalDocuments ?? "—" },
  { label: "Conversations", value: metrics.value.totalChats ?? "—" },
  { label: "Avg response (ms)", value: metrics.value.averageResponseTimeMs ?? "—" },
]);
const userHeaders = [
  { title: "Email", key: "email" },
  { title: "Name", key: "full_name" },
  { title: "Role", key: "role" },
  { title: "Created", key: "created_at" },
];
const docHeaders = [
  { title: "Title", key: "title" },
  { title: "Uploader", key: "uploaded_by" },
  { title: "Status", key: "status" },
  { title: "Chunks", key: "total_chunks" },
];
function statusColor(s: string) {
  return ({ pending: "grey", processing: "blue", completed: "success", failed: "error" } as any)[s] ?? "grey";
}

onMounted(async () => {
  const [m, u, d] = await Promise.all([
    http.get("/admin/metrics"),
    http.get("/admin/users"),
    http.get("/admin/documents"),
  ]);
  metrics.value = m.data; users.value = u.data; docs.value = d.data;
});
</script>
