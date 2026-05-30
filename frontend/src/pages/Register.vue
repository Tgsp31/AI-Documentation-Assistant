<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card width="460" class="pa-4">
      <v-card-title>Create account</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="fullName" label="Full name" required />
          <v-text-field v-model="email" label="Email" type="email" required />
          <v-text-field v-model="password" label="Password" type="password" hint="At least 8 characters" required />
          <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
          <v-btn block color="primary" type="submit" :loading="loading">Register</v-btn>
          <v-btn block variant="text" class="mt-2" to="/login">Back to login</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../stores/auth";

const fullName = ref(""), email = ref(""), password = ref("");
const error = ref(""), loading = ref(false);
const auth = useAuth(); const router = useRouter();

async function submit() {
  error.value = ""; loading.value = true;
  try {
    await auth.register(email.value, password.value, fullName.value);
    router.push("/dashboard");
  } catch (e: any) {
    error.value = e?.response?.data?.error || "Registration failed";
  } finally { loading.value = false; }
}
</script>
