<template>
  <v-card>
    <v-card-title>Search</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="7">
          <v-text-field v-model="q" label="Query" @keyup.enter="run" />
        </v-col>
        <v-col cols="6" md="3">
          <v-select v-model="mode" :items="['hybrid','semantic','keyword']" label="Mode" />
        </v-col>
        <v-col cols="6" md="2">
          <v-btn block color="primary" :loading="loading" @click="run">Search</v-btn>
        </v-col>
      </v-row>

      <v-list v-if="results.length">
        <v-list-item v-for="r in results" :key="r.chunkId" lines="three">
          <v-list-item-title>
            {{ r.documentName }} <span class="text-caption text-grey">p.{{ r.pageNumber ?? '?' }}</span>
          </v-list-item-title>
          <v-list-item-subtitle style="white-space: normal">{{ r.snippet }}…</v-list-item-subtitle>
          <template #append>
            <v-chip size="x-small">{{ r.score.toFixed(3) }}</v-chip>
          </template>
        </v-list-item>
      </v-list>
      <div v-else-if="ran" class="text-grey">No results.</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { http } from "../api/http";

const q = ref(""); const mode = ref<"hybrid"|"semantic"|"keyword">("hybrid");
const loading = ref(false); const ran = ref(false);
const results = ref<any[]>([]);

async function run() {
  if (!q.value.trim()) return;
  loading.value = true; ran.value = true;
  try {
    const { data } = await http.get("/search", { params: { q: q.value, mode: mode.value, k: 10 } });
    results.value = data.results;
  } finally { loading.value = false; }
}
</script>
