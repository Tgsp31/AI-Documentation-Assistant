<template>
  <v-card max-width="640">
    <v-card-title>Upload document</v-card-title>
    <v-card-text>
      <v-form @submit.prevent="submit">
        <v-text-field v-model="title" label="Title (optional)" />
        <v-file-input
          v-model="file"
          label="PDF, DOCX or TXT"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          show-size
          required
        />
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
        <v-alert v-if="ok" type="success" variant="tonal" class="mb-3">Uploaded — processing will begin in the background.</v-alert>
        <v-btn color="primary" type="submit" :loading="loading" :disabled="!file">Upload</v-btn>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDocs } from "../stores/docs";
const docs = useDocs();
const title = ref(""); const file = ref<File | File[] | null>(null);
const loading = ref(false); const error = ref(""); const ok = ref(false);

async function submit() {
  error.value = ""; ok.value = false;
  const f = Array.isArray(file.value) ? file.value[0] : file.value;
  if (!f) return;
  loading.value = true;
  try { await docs.upload(f, title.value); ok.value = true; file.value = null; title.value = ""; }
  catch (e: any) { error.value = e?.response?.data?.error || "Upload failed"; }
  finally { loading.value = false; }
}
</script>
