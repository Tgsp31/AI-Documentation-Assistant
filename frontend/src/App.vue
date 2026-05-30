<template>
  <v-app>
    <router-view v-if="auth.ready" />
    <v-main v-else class="d-flex align-center justify-center">
      <v-progress-circular indeterminate />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useAuth } from "./stores/auth";
const auth = useAuth();
</script>
