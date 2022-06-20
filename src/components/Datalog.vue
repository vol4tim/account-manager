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
    <div v-if="isLoad" class="text-center">
      <i class="fa fa-ellipsis-h"></i>
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
          <Pagination :size="5" :listData="log" :currentPage="currentPage">
            <template v-slot:default="props">
              <tr>
                <td style="width: 150px">{{ props.item[0] }}</td>
                <td class="text-left">
                  <div v-if="props.item[2] === null" :title="props.item[1]">
                    {{ props.item[1].substr(0, 5) }}...{{
                      props.item[1].substr(-5)
                    }}
                  </div>
                  <div
                    v-if="props.item[2] && props.item[3] === null"
                    :title="props.item[2]"
                  >
                    {{ props.item[2].substr(0, 5) }}...{{
                      props.item[2].substr(-5)
                    }}
                  </div>
                  <pre
                    style="max-height: 200px"
                  ><code v-if="props.item[3]"> {{ props.item[3] }} </code></pre>
                </td>
                <td class="text-right" style="width: 100px">
                  <button
                    v-if="
                      props.item[2] === null &&
                      props.item[1].substr(0, 2) === 'Qm'
                    "
                    @click="readByIndex(props.item[5])"
                    class="btn btn-success"
                    :disabled="props.item[4]"
                  >
                    <i v-if="props.item[4]" class="fa fa-ellipsis-h"></i>
                    <template v-else>read</template>
                  </button>
                  <button
                    v-if="
                      validateUri && props.item[2] && props.item[3] === null
                    "
                    @click="decryptByIndex(props.item[5])"
                    class="btn btn-success"
                  >
                    decrypt
                  </button>
                </td>
              </tr>
            </template>

            <template v-slot:pagination="props">
              <tr>
                <td colspan="3" class="text-center">
                  <button
                    :disabled="props.pageNumber === 0"
                    @click="prevPage"
                    class="btn btn-info"
                  >
                    Previous
                  </button>
                  &nbsp;
                  <b>
                    {{ props.pageCount > 0 ? props.pageNumber + 1 : 0 }} /
                    {{ props.pageCount }}
                  </b>
                  &nbsp;
                  <button
                    :disabled="props.pageNumber >= props.pageCount - 1"
                    @click="nextPage"
                    class="btn btn-info"
                  >
                    Next
                  </button>
                </td>
              </tr>
            </template>
          </Pagination>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import robonomics from "../robonomics";
import { Keyring } from "@polkadot/keyring";
import { u8aToString } from "@polkadot/util";
import { encodeAddress } from "@polkadot/util-crypto";
import { catFile } from "../ipfs";
import Pagination from "./Pagination";

export default {
  components: { Pagination },
  props: ["address"],
  data() {
    return {
      isLoad: false,
      log: [],
      uri: "",
      currentPage: 0
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
    nextPage() {
      this.currentPage++;
    },
    prevPage() {
      this.currentPage--;
    },
    handlePage(page) {
      this.currentPage = page;
    },
    async read() {
      this.isLoad = true;
      const log = await robonomics.datalog.read(this.address);
      this.log = log.reverse().map((item, id) => {
        return [
          new Date(item[0].toNumber()).toLocaleString(),
          item[1].toHuman(),
          null,
          null,
          false,
          id
        ];
      });
      this.isLoad = false;
    },
    async readByIndex(i) {
      this.log[i][4] = true;
      try {
        this.log[i][2] = await catFile(this.log[i][1]);
        this.log[i][4] = false;
      } catch (error) {
        console.log(error);
        this.readByIndex(i);
      }
    },
    decryptByIndex(i) {
      try {
        const msg = this.decrypt(this.log[i][2]);
        try {
          this.log[i][3] = JSON.stringify(
            JSON.parse(msg.replaceAll("None", "'None'").replaceAll("'", '"')),
            null,
            4
          );
        } catch (error) {
          console.log(error);
          this.log[i][3] = msg;
        }
      } catch (error) {
        console.log(error);
      }
    },
    decrypt(encryptMessage) {
      const decryptMessage = this.account.decryptMessage(
        encryptMessage,
        this.account.publicKey
      );
      return u8aToString(decryptMessage);
    }
  }
};
</script>
