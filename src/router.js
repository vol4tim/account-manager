import { createRouter, createWebHashHistory } from "vue-router";
import Main from "@/views/Main";
import Datalog from "@/views/Datalog";

const routes = [
  {
    path: "/",
    name: "main",
    component: Main
  },
  {
    path: "/datalog/:address",
    name: "datalog",
    component: Datalog,
    props: true
  }
];

export default createRouter({
  history: createWebHashHistory(),
  routes
});
