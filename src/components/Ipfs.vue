<template>
  <div class="card mb-2">
    <div class="card-body">
      <h4 class="card-heading">IPFS</h4>
      <h5>{{ status }}</h5>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      status: "Connecting",
      online: false
    };
  },
  mounted() {
    this.getIpfsNodeInfo();
  },
  methods: {
    async getIpfsNodeInfo() {
      try {
        const ipfs = await this.$ipfs;
        this.status = "Connected";
        this.online = ipfs.isOnline();
      } catch (err) {
        this.status = `Error: ${err}`;
      }
    }
  }
};
</script>
