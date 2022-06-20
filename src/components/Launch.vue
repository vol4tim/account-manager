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

      <div class="mb-3">
        <div class="container">
          <div class="row justify-content-md-end">
            <div class="col-md-2">
              <div class="form-check">
                <input
                  v-model="isCrypto"
                  class="form-check-input"
                  type="checkbox"
                  id="isCrypto"
                />
                <label class="form-check-label" for="isCrypto">crypto</label>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isCrypto">
          <h5 class="card-title">Your secret key for crypt message</h5>
          <input
            v-model="uri"
            type="password"
            class="form-control"
            placeholder="secret"
          />
          <div v-if="!validateUri" class="alert alert-warning mt-2">
            Input your secret key
          </div>

          <input
            v-if="validateUri"
            v-model="encryptMessage"
            class="form-control"
            disabled
          />
        </div>
      </div>

      <div v-if="message" class="alert alert-info">{{ message }}</div>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div class="text-end">
        <button
          @click="save"
          class="btn btn-primary"
          :disabled="process || !canSend"
        >
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
import { Keyring } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { encodeAddress } from "@polkadot/util-crypto";

export default {
  props: ["address", "sender"],
  data() {
    return {
      platform: "",
      name: "",
      params: [],
      error: null,
      message: null,
      process: false,
      isCrypto: false,
      uri: ""
    };
  },
  computed: {
    account() {
      if (this.uri) {
        try {
          console.log(this.address);
          const k = new Keyring();
          const a1 = k.addFromUri(this.uri, {}, "ed25519");
          console.log(encodeAddress(this.address), encodeAddress(a1.address));
          if (encodeAddress(this.address) === encodeAddress(a1.address)) {
            return a1;
          }
          const a2 = k.addFromUri(this.uri, {}, "sr25519");
          console.log(encodeAddress(this.address), encodeAddress(a2.address));
          if (encodeAddress(this.address) === encodeAddress(a2.address)) {
            return a2;
          }
          return a1;
        } catch (error) {
          console.log(error);
        }
      }
      return null;
    },
    validateUri() {
      if (
        this.account &&
        encodeAddress(this.address) === encodeAddress(this.account.address)
      ) {
        return true;
      }
      return false;
    },
    encryptMessage() {
      if (this.validateUri) {
        return this.encrypt(this.getParameter());
      }
      return "";
    },
    canSend() {
      if (this.isCrypto) {
        if (this.validateUri && this.encryptMessage) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    }
  },
  created() {
    this.params.push({ name: "entity_id", value: "" });
  },
  methods: {
    getParameter() {
      const params = {};
      for (const item of this.params) {
        params[item.name] = item.value;
      }
      const parameter = {
        platform: this.platform,
        name: this.name,
        params: params
      };
      return JSON.stringify(parameter);
    },
    async save() {
      this.message = null;
      this.error = null;
      this.process = true;
      const subscriber = robonomics.accountManager.account.address;
      try {
        let msg = this.getParameter();
        if (this.isCrypto && this.validateUri) {
          msg = this.encryptMessage();
        }
        const hash = await addFile("launch", msg);
        console.log("subscription", subscriber);
        console.log("sender", this.sender);
        robonomics.accountManager.useSubscription(subscriber, this.sender);
        console.log("signer", robonomics.accountManager.account.address);
        const tx = await robonomics.launch.send(
          this.address,
          utils.cidToHex(hash)
        );
        const resultTx = await robonomics.accountManager.signAndSend(tx);
        console.log(resultTx);
        this.process = false;
        this.message = `Saved to block ${resultTx.blockNumber}`;
      } catch (e) {
        console.log(e);
        this.error = e.message;
        this.process = false;
      }
      robonomics.accountManager.setSender(subscriber);
    },
    addParam() {
      this.params.push({ name: "", value: "" });
    },
    removeParam(key) {
      this.params.splice(key, 1);
    },
    encrypt(message) {
      const encryptMessage = this.account.encryptMessage(
        message,
        this.account.publicKey
      );
      return u8aToHex(encryptMessage);
    }
  }
};
</script>
