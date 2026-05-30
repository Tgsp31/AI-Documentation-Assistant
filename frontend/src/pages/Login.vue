<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card width="420" class="pa-4">
      <v-card-title>Sign in</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="email" label="Email" type="email" required />
          <v-text-field v-model="password" label="Password" type="password" required />
          <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
          <v-btn block color="primary" type="submit" :loading="loading">Login</v-btn>
          <v-btn block variant="text" class="mt-2" to="/register">Create an account</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../stores/auth";

const email = ref(""), password = ref(""), error = ref(""), loading = ref(false);
const auth = useAuth(); const router = useRouter(); const route = useRoute();

async function submit() {
  error.value = ""; loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push((route.query.next as string) || "/dashboard");
  } catch (e: any) {
    error.value = e?.response?.data?.error || "Login failed";
  } finally { loading.value = false; }
}
</script>
