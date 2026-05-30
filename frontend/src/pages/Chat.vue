<template>
  <v-row>
    <v-col cols="12" md="3">
      <v-card>
        <v-card-title class="d-flex">
          History
          <v-spacer />
          <v-btn icon="mdi-plus" variant="text" @click="chat.startNew()" />
        </v-card-title>
        <v-list density="compact">
          <v-list-item
            v-for="c in chat.conversations"
            :key="c.id"
            :title="c.title"
            :active="chat.current?.id === c.id"
            @click="chat.openConversation(c.id)"
          >
            <template #append>
              <v-btn icon="mdi-delete" size="x-small" variant="text" @click.stop="chat.deleteConversation(c.id)" />
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-col>

    <v-col cols="12" md="9">
      <v-card class="d-flex flex-column" style="min-height: 70vh">
        <v-card-text class="flex-grow-1 overflow-y-auto">
          <div v-if="!chat.current" class="text-grey">Ask a question to start a new conversation.</div>
          <div v-for="m in chat.current?.messages ?? []" :key="m.id" class="mb-4">
            <v-chip size="small" :color="m.role === 'user' ? 'primary' : 'success'" class="mb-1">
              {{ m.role }}
            </v-chip>
            <div style="white-space: pre-wrap">{{ m.content }}</div>
            <div v-if="m.sources?.sources?.length" class="mt-2">
              <v-chip
                v-for="(s, i) in m.sources.sources"
                :key="i"
                size="x-small"
                variant="outlined"
                class="mr-1"
              >
                #{{ i + 1 }} {{ s.documentName }} (p.{{ s.pageNumber ?? '?' }})
              </v-chip>
              <span v-if="m.sources?.confidence" class="ml-2 text-caption">
                confidence: {{ m.sources.confidence }}
              </span>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-text-field
            v-model="question"
            placeholder="Ask about your documents…"
            hide-details
            density="comfortable"
            variant="outlined"
            @keyup.enter="send"
          />
          <v-btn color="primary" :loading="chat.sending" :disabled="!question.trim()" @click="send">
            Send
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useChat } from "../stores/chat";
const chat = useChat();
const question = ref("");
onMounted(() => chat.fetchConversations());

async function send() {
  const q = question.value.trim();
  if (!q) return;
  question.value = "";
  await chat.ask(q);
}
</script>
