<template>
  <v-card max-width="540">
    <v-card-title>Profile</v-card-title>
    <v-card-text v-if="auth.user">
      <v-list>
        <v-list-item title="Email" :subtitle="auth.user.email" />
        <v-list-item title="Role" :subtitle="auth.user.role" />
        <v-list-item v-if="auth.user.fullName" title="Name" :subtitle="auth.user.fullName" />
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useAuth } from "../stores/auth";
const auth = useAuth();
</script>
