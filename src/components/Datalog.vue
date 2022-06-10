<template>
  <div class="mt-4">
    <div class="row">
      <div class="col-md-6">
        <h3>Datalog</h3>
      </div>
      <div class="col-md-6 text-end pt-2">
        <router-link :to="{ name: 'main' }">Back</router-link>
      </div>
    </div>
    <div v-if="log.length">
      <div class="card mt-4 mb-4">
        <div class="card-body">
          <h4 class="card-title">Your secret key for decrypt message</h4>
          <input
            v-model="uri"
            type="password"
            class="form-control"
            placeholder="secret"
          />
          <div v-if="!validateUri" class="alert alert-warning mt-2">
            Input your secret key
          </div>
        </div>
      </div>
      <table class="table">
        <tbody>
          <tr v-for="(item, key) in log" :key="key">
            <td style="width: 150px">{{ item[0] }}</td>
            <td class="text-left">
              <div v-if="item[2] === null" :title="item[1]">
                {{ item[1].substr(0, 5) }}...{{ item[1].substr(-5) }}
              </div>
              <div v-if="item[2] && item[3] === null" :title="item[2]">
                {{ item[2].substr(0, 5) }}...{{ item[2].substr(-5) }}
              </div>
              <code v-if="item[3]"> {{ item[3] }} </code>
            </td>
            <td class="text-right" style="width: 100px">
              <button
                v-if="item[2] === null && item[1].substr(0, 2) === 'Qm'"
                @click="readByIndex(key)"
                class="btn btn-success"
              >
                read
              </button>
              <button
                v-if="validateUri && item[2] && item[3] === null"
                @click="decryptByIndex(key)"
                class="btn btn-success"
              >
                decrypt
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import robonomics from "../robonomics";
const { Keyring } = require("@polkadot/keyring");
const util = require("@polkadot/util");
import { encodeAddress } from "@polkadot/util-crypto";
import { catFile } from "../ipfs";

export default {
  props: ["address"],
  data() {
    return {
      log: [],
      uri: ""
    };
  },
  created() {
    this.read();
  },
  computed: {
    account() {
      if (this.uri) {
        try {
          const k = new Keyring();
          const a1 = k.addFromUri(this.uri, {}, "ed25519");
          if (encodeAddress(this.address) === encodeAddress(a1.address)) {
            return a1;
          }
          const a2 = k.addFromUri(this.uri, {}, "sr25519");
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
      if (this.account) {
        console.log(this.account.type);
        console.log(this.address, encodeAddress(this.address));
        console.log(this.account.address, encodeAddress(this.account.address));
      }
      if (
        this.account &&
        encodeAddress(this.address) === encodeAddress(this.account.address)
      ) {
        return true;
      }
      return false;
    }
  },
  methods: {
    async read() {
      const log = await robonomics.datalog.read(this.address);
      this.log = log.map((item) => {
        return [
          new Date(item[0].toNumber()).toLocaleString(),
          item[1].toHuman(),
          null,
          null
        ];
      });
    },
    async readByIndex(i) {
      try {
        this.log[i][2] = await catFile(this.log[i][1]);
      } catch (error) {
        console.log(error);
      }
    },
    decryptByIndex(i) {
      try {
        this.log[i][3] = this.decrypt(this.log[i][2]);
      } catch (error) {
        console.log(error);
      }
    },
    decrypt(encryptMessage) {
      const decryptMessage = this.account.decryptMessage(
        encryptMessage,
        this.account.publicKey
      );
      return util.u8aToString(decryptMessage);
    }
  }
};
</script>
