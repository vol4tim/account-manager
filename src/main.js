import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { vfmPlugin } from "vue-final-modal";
import Ipfs from "./ipfs";
import store from "./store";
import { robonomicsUI } from "robonomics-ui-vue";
import "robonomics-ui-vue/style.css";
        
createApp(App).use(router).use(vfmPlugin).use(Ipfs).use(store).use(robonomicsUI, { store }).mount("#app");
