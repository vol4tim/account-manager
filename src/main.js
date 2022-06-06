import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { vfmPlugin } from "vue-final-modal";
import Ipfs from "./ipfs";

createApp(App).use(router).use(vfmPlugin).use(Ipfs).mount("#app");
