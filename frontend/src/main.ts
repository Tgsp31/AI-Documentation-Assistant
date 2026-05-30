import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import App from "./App.vue";
import { router } from "./router";
import { useAuth } from "./stores/auth";

const vuetify = createVuetify({
  components,
  directives,
  theme: { defaultTheme: "dark" },
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(vuetify);

// hydrate auth from localStorage before mounting router guards
useAuth().hydrate();

app.use(router);
app.mount("#app");
