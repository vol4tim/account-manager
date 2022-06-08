<template>
  <div>
    <div class="card mb-4">
      <div class="card-body">
        <h4 class="card-title">Your subscription</h4>
        <div v-if="!isActive">Not active</div>
        <div v-else>
          <div>
            <b>{{ countMonth }} Month</b>
          </div>
          <div>Active till: {{ validUntilFormat }}</div>
        </div>
      </div>
    </div>
    <div v-if="isActive">
      <h3>Your accounts</h3>
      <div class="table-responsive">
        <table class="table">
          <tbody>
            <tr v-for="(device, i) in devices" :key="i">
              <td scope="row">
                <router-link
                  v-if="ha === device.address"
                  :to="{ name: 'datalog', params: { address: device.address } }"
                >
                  <span class="d-lg-none">
                    {{ device.address.substr(0, 5) }}...{{
                      device.address.substr(-5)
                    }}
                  </span>
                  <span class="d-none d-lg-block">{{ device.address }}</span>
                </router-link>
                <template v-else>
                  <span class="d-lg-none">
                    {{ device.address.substr(0, 5) }}...{{
                      device.address.substr(-5)
                    }}
                  </span>
                  <span class="d-none d-lg-block">{{ device.address }}</span>
                </template>
              </td>
              <td class="text-end">
                <div class="btn-group" role="group">
                  <button
                    v-if="ha !== device.address"
                    @click="launch(device.address)"
                    class="btn btn-primary"
                    :disabled="ha === null"
                  >
                    <i class="fa fa-send"></i>
                  </button>
                  <button
                    @click="setHa(device.address)"
                    class="btn btn-info"
                    :disabled="ha === device.address"
                  >
                    <i
                      class="fa"
                      :class="[ha === device.address ? 'fa-star' : 'fa-star-o']"
                    ></i>
                  </button>
                  <button
                    @click="remove(device.address)"
                    class="btn btn-danger"
                  >
                    <i class="fa fa-remove"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <input
                  v-model="newDeviceAddress"
                  placeholder="Address"
                  class="form-control"
                  :class="{ error: err }"
                />
              </td>
              <td class="text-end">
                <button @click="add" class="btn btn-success">
                  <span class="fa fa-plus"></span>
                </button>
              </td>
            </tr>
            <tr>
              <td colspan="2" class="text-end">
                <button
                  @click="save"
                  class="btn btn-primary"
                  :disabled="!hasEdit || process"
                >
                  <i v-if="process" class="fa fa-ellipsis-h"></i>
                  <template v-else>Save</template>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import robonomics from "../robonomics";
import { checkAddress } from "@polkadot/util-crypto";
import Modal from "./Modal";

export default {
  data() {
    return {
      owner: null,
      subscription: null,
      devices: [],
      newDeviceAddress: "",
      err: false,
      error: null,
      process: false,
      hasEdit: false,
      ha: null
    };
  },
  computed: {
    countMonth() {
      if (this.subscription === null) {
        return 0;
      }
      let days = 0;
      if (this.subscription.kind.isDaily) {
        days = this.subscription.kind.value.days.toNumber();
      }
      return days / 30;
    },
    validUntil() {
      if (this.subscription === null) {
        return false;
      }
      const issue_time = this.subscription.issueTime.toNumber();
      let days = 0;
      if (this.subscription.kind.isDaily) {
        days = this.subscription.kind.value.days.toNumber();
      }
      return issue_time + days * (24 * 60 * 60 * 1000);
    },
    validUntilFormat() {
      if (this.subscription === null) {
        return "-";
      }
      return new Date(this.validUntil).toLocaleString();
    },
    isActive() {
      // if (this.subscription === null || Date.now() > this.validUntil) {
      //   return false;
      // }
      return true;
    }
  },
  created() {
    this.ha = localStorage.getItem("ha") || null;

    if (robonomics.accountManager.account) {
      this.owner = robonomics.accountManager.account.address;
      this.loadLadger();
      this.loadDevices();
    }
    this.unsubscribe = robonomics.accountManager.onChange((account) => {
      this.subscription = null;
      this.owner = account.address;
      this.loadLadger();
      this.loadDevices();
    });
  },
  methods: {
    async loadLadger() {
      const subscription = await robonomics.rws.getLedger(this.owner);
      if (!subscription.isEmpty) {
        this.subscription = subscription.value;
      }
    },
    async loadDevices() {
      const devices = await robonomics.rws.getDevices(this.owner);
      this.devices = devices.map((item) => {
        return {
          address: item.toHuman()
        };
      });
    },
    async save() {
      this.error = null;
      this.process = true;
      try {
        const tx = await robonomics.rws.setDevices(
          this.devices.map((item) => item.address)
        );
        const resultTx = await robonomics.accountManager.signAndSend(tx);
        console.log("saved block", resultTx.block, resultTx.tx);
        this.loadDevices();
        this.process = false;
      } catch (e) {
        console.log(e);
        this.error = e.message;
        this.process = false;
      }
      this.hasEdit = false;
    },
    launch(sender) {
      this.$vfm.show({
        component: Modal,
        bind: {
          address: this.ha,
          sender: sender
        }
      });
    },
    add() {
      this.err = false;
      if (
        this.newDeviceAddress &&
        this.newDeviceAddress.length === 48 &&
        this.devices.findIndex(
          (item) => item.address === this.newDeviceAddress
        ) < 0 &&
        checkAddress(
          this.newDeviceAddress,
          robonomics.api.registry.chainSS58
        )[0]
      ) {
        this.devices.push({
          address: this.newDeviceAddress
        });
        this.newDeviceAddress = "";
        this.hasEdit = true;
      } else {
        this.err = true;
      }
    },
    remove(device) {
      this.devices = this.devices.filter((item) => item.address !== device);
      this.hasEdit = true;
    },
    setHa(address) {
      localStorage.setItem("ha", address);
      this.ha = address;
    }
  }
};
</script>
