<template>
  <robo-card outlined>
    <robo-list fullLine>
      <robo-list-item>
        <robo-card-title size="3">Account</robo-card-title>
        <template v-if="isReady">
          <select v-model="account" class="form-select">
            <option
              v-for="(account, key) in accounts"
              :key="key"
              :value="account.address"
            >
              {{ account.meta.isTesting ? "dev" : "" }} {{ account.meta.name }} |
              {{ account.meta?.source }}
            </option>
          </select>
          <br />
          {{ account }} | {{ balancePrint }}
        </template>
        <robo-button size="small" v-else @click="connect" class="btn btn-default">connect</robo-button>
        <p v-if="error" class="alert alert-danger">{{ error }}</p>
      </robo-list-item>
    </robo-list>
  </robo-card>
</template>

<script>
import { AccountManagerUi as AccountManager } from "robonomics-interface";
import robonomics from "../robonomics";
import { formatBalance } from "@polkadot/util";

export default {
  data() {
    return {
      isReady: false,
      account: null,
      accounts: [],
      unsubscribe: null,
      balance: "",
      error: ""
    };
  },
  created() {
    this.connect();
    robonomics.accountManager.onReady(() => {
      this.isReady = true;
      console.log("allow");
      console.log("polkadot-js", AccountManager.checkAllow("polkadot-js"));
      console.log("talisman", AccountManager.checkAllow("talisman"));
      console.log("subwallet-js", AccountManager.checkAllow("subwallet-js"));
    });
    setTimeout(() => {
      console.log("installed");
      console.log("polkadot-js", AccountManager.checkInstalled("polkadot-js"));
      console.log("talisman", AccountManager.checkInstalled("talisman"));
      console.log(
        "subwallet-js",
        AccountManager.checkInstalled("subwallet-js")
      );
    }, 1000);
  },
  computed: {
    balancePrint() {
      return formatBalance(this.balance, {
        decimals: robonomics.api.registry.chainDecimals[0],
        withUnit: robonomics.api.registry.chainTokens[0]
      });
    }
  },
  watch: {
    async account(address) {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
      await robonomics.accountManager.selectAccountByAddress(address);
      this.unsubscribe = await robonomics.account.getBalance(address, (r) => {
        this.balance = r.free.sub(r.feeFrozen);
      });
    }
  },
  methods: {
    async connect() {
      this.error = "";
      try {
        await AccountManager.initPlugin(robonomics.accountManager.keyring, {
          isDevelopment: false
        });
        this.accounts = robonomics.accountManager.getAccounts();
        if (this.accounts.length) {
          this.account = this.accounts[0].address;
        }
      } catch (error) {
        this.error = error.message;
      }
    }
  }
};
</script>
