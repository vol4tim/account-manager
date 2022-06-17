<template>
  <div>
    <h4>Launch</h4>
    <div>
      <div class="mb-3">
        <label for="platform" class="form-label">Platform</label>
        <input
          id="platform"
          v-model="platform"
          placeholder=""
          class="form-control"
        />
      </div>
      <div class="mb-3">
        <label for="name" class="form-label">Name</label>
        <input id="name" v-model="name" placeholder="" class="form-control" />
      </div>

      <h5>Params</h5>
      <div class="input-group mb-3" v-for="(item, key) in params" :key="key">
        <span class="input-group-text">Name</span>
        <input v-model="item.name" class="form-control" />
        <span class="input-group-text">Value</span>
        <input v-model="item.value" class="form-control" />
        <button
          @click="removeParam(key)"
          class="btn btn-danger"
          :disabled="key === 0"
        >
          <i class="fa fa-remove"></i>
        </button>
      </div>

      <div class="text-end mb-3">
        <button @click="addParam" class="btn btn-success">
          <i class="fa fa-plus"></i>
        </button>
      </div>

      <div v-if="message" class="alert alert-info">{{ message }}</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="text-end">
        <button @click="save" class="btn btn-primary" :disabled="process">
          <i v-if="process" class="fa fa-ellipsis-h"></i>
          <template v-else>Send</template>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { utils } from "robonomics-interface";
import robonomics from "../robonomics";
import { addFile } from "../ipfs";

export default {
  props: ["address", "sender"],
  data() {
    return {
      platform: "",
      name: "",
      params: [],
      error: null,
      message: null,
      process: false
    };
  },
  created() {
    this.params.push({ name: "entity_id", value: "" });
  },
  methods: {
    async save() {
      this.message = null;
      this.error = null;
      this.process = true;
      try {
        const params = {};
        for (const item of this.params) {
          params[item.name] = item.value;
        }
        const parameter = {
          platform: this.platform,
          name: this.name,
          params: params
        };
        const hash = await addFile("launch", JSON.stringify(parameter));
        const subscriber = robonomics.accountManager.account.address;
        robonomics.accountManager.useSubscription(subscriber, this.sender);
        const tx = await robonomics.launch.send(
          this.address,
          utils.cidToHex(hash)
        );
        const resultTx = await robonomics.accountManager.signAndSend(tx);
        robonomics.accountManager.setSender(subscriber);
        console.log(resultTx);
        this.process = false;
        this.message = `Saved to block ${resultTx.blockNumber}`;
      } catch (e) {
        console.log(e);
        this.error = e.message;
        this.process = false;
      }
    },
    addParam() {
      this.params.push({ name: "", value: "" });
    },
    removeParam(key) {
      this.params.splice(key, 1);
    }
  }
};
</script>
