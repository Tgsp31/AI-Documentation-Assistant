<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Welcome, {{ auth.user?.email }}</v-card-title>
        <v-card-text>
          Use the sidebar to upload documents and ask the AI questions about them.
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card>
        <v-card-title>Your documents</v-card-title>
        <v-card-text class="text-h4">{{ docs.list.length }}</v-card-text>
        <v-card-actions><v-btn to="/documents" variant="tonal">Manage</v-btn></v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuth } from "../stores/auth";
import { useDocs } from "../stores/docs";
const auth = useAuth(); const docs = useDocs();
onMounted(() => docs.fetch());
</script>
