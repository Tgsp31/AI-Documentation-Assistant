<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Documents
      <v-spacer />
      <v-btn icon="mdi-refresh" variant="text" @click="docs.fetch()" />
      <v-btn v-if="auth.canUpload" to="/upload" color="primary" prepend-icon="mdi-upload">Upload</v-btn>
    </v-card-title>
    <v-data-table
      :loading="docs.loading"
      :items="docs.list"
      :headers="headers"
      items-per-page="20"
    >
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small">{{ item.status }}</v-chip>
      </template>
      <template #item.upload_date="{ item }">
        {{ new Date(item.upload_date).toLocaleString() }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-if="auth.canUpload"
          icon="mdi-delete"
          variant="text"
          color="error"
          @click="remove(item.id)"
        />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useDocs } from "../stores/docs";
import { useAuth } from "../stores/auth";

const docs = useDocs(); const auth = useAuth();
onMounted(() => docs.fetch());

const headers = [
  { title: "Title", key: "title" },
  { title: "File", key: "filename" },
  { title: "Status", key: "status" },
  { title: "Chunks", key: "total_chunks" },
  { title: "Uploaded", key: "upload_date" },
  { title: "", key: "actions", sortable: false },
];
function statusColor(s: string) {
  return ({ pending: "grey", processing: "blue", completed: "success", failed: "error" } as any)[s] ?? "grey";
}
async function remove(id: string) {
  if (confirm("Delete this document and all its chunks?")) await docs.remove(id);
}
</script>
