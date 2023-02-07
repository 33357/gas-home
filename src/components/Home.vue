<template>
  <div>
    <el-card class="box-card">
      <el-form label-width="30%">
        <el-form-item label="GasLimit :">
          <el-input v-model="gasLimit" type="string"> </el-input>
        </el-form-item>
        <el-form-item label="executionTime :">
          <el-input v-model="executionTime" type="string"> </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="doEstimateGasPrice()"
            :loading="estimateGasPriceLoad"
            >EstimateGasPrice</el-button
          >
        </el-form-item>
      </el-form>
      <el-divider />
      <el-form label-width="30%">
        <el-form-item label="GasPrice :">
          <div>
            {{ `${utils.etherUtils.formatUnits(gasPrice, "gwei")} gwei` }}
          </div>
        </el-form-item>
      </el-form>
      <el-divider />
    </el-card>
  </div>
</template>

<script lang="ts">
import { BigNumber, utils, log } from "../const";
import { mapState, mapActions } from "vuex";
import { State } from "../store";

export default {
  data() {
    return {
      utils: utils,
      gasPrice: BigNumber.from(0),
      gasLimit: "",
      executionTime: "",
      estimateGasPriceLoad: false,
    };
  },
  async created() {},
  computed: mapState({
    state: (state: any) => state as State,
  }),
  methods: {
    ...mapActions(["estimateGasPrice"]),
    async doEstimateGasPrice() {
      this.estimateGasPriceLoad = true;
      await this.estimateGasPrice({
        gasLimit: Number(this.gasLimit),
        executionTime: Number(this.executionTime) * 3,
      });
      this.estimateGasPriceLoad = false;
      this.state.home.gasPriceList.sort((a, b) => {
        return a.gt(b) ? 1 : -1;
      });
      const wei_10 = BigNumber.from(10 ** 8);
      this.gasPrice = this.state.home.gasPriceList[2].div(wei_10).mul(wei_10);
      if (!this.state.home.gasPriceList[2].mod(wei_10).eq(0)) {
        this.gasPrice = this.gasPrice.add(wei_10);
      }
    },
  },
};
</script>

<style>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  width: 700px;
  margin-left: auto;
  margin-right: auto;
}
</style>

