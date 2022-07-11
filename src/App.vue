<template>
  <div class="container mt-5 mb-5">
    <template v-if="isReady">
      <div class="row justify-content-md-center">
        <div class="col-md-6 col-sm-12">
          <Account />
        </div>
        <div class="col-md-2 col-sm-12">
          <Ipfs />
        </div>
      </div>
      <div class="row justify-content-md-center">
        <div class="col-md-8 col-sm-12">
          <router-view></router-view>
        </div>
      </div>
    </template>
    <template v-else><i class="fa fa-ellipsis-h"></i></template>
  </div>
  <modals-container></modals-container>
</template>

<script>
import Account from "./components/Account.vue";
import Ipfs from "./components/Ipfs.vue";
import robonomics from "./robonomics";

export default {
  name: "App",
  components: { Account, Ipfs },
  data() {
    return {
      isReady: false
    };
  },
  async created() {
    await robonomics.run();
    this.isReady = true;
  }
};
</script>

<style>
body {
  background-color: #fff;
}
</style>
