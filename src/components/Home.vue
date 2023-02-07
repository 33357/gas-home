<template>
  <div>
    <el-card class="box-card">
      <el-form label-width="30%">
        <el-form-item label="GasLimit :">
          <el-input v-model="gasLimit" type="string"> </el-input>
        </el-form-item>
        <el-form-item label="executionTime :">
          <el-input v-model="executionTime" class="input-with-select">
            <template #append>
              <el-select
                v-model="executionTimeSelect"
                placeholder="Select"
                style="width: 115px"
              >
                <el-option label="Second" value="1" />
                <el-option label="Minute" value="2" />
                <el-option label="Hour" value="3" />
                <el-option label="Day" value="4" />
              </el-select>
            </template>
          </el-input>
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
        <el-form-item label="Lowest GasPrice :">
          <div>
            {{ `${utils.etherUtils.formatUnits(gasPrice, "gwei")} gwei` }}
          </div>
        </el-form-item>
      </el-form>
      <el-divider />
      <el-table :data="tableDataList" stripe style="width: 100%">
        <el-table-column prop="gasPriceStr" label="GasPrice" width="300" />
        <el-table-column prop="amount" label="Amount" />
      </el-table>
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
      executionTimeSelect: "1",
      estimateGasPriceLoad: false,
      tableDataList: [],
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
      this.tableDataList = [];
      this.gasPrice = BigNumber.from(0);
      let executionTime = Number(this.executionTime) * 3;
      if (this.executionTimeSelect == "2") {
        executionTime *= 60;
      } else if (this.executionTimeSelect == "3") {
        executionTime *= 60 * 60;
      } else if (this.executionTimeSelect == "4") {
        executionTime *= 60 * 60 * 24;
      }
      await this.estimateGasPrice({
        gasLimit: Number(this.gasLimit),
        executionTime: executionTime,
      });
      this.estimateGasPriceLoad = false;
      const wei_10 = BigNumber.from(10 ** 8);
      const tableDataList: {
        gasPrice: BigNumber;
        gasPriceStr: string;
        amount: number;
      }[] = [];
      this.state.home.gasPriceList
        .sort((a, b) => {
          return a.gt(b) ? 1 : -1;
        })
        .forEach((e) => {
          let gasPrice = e.div(wei_10).mul(wei_10);
          if (
            tableDataList.length == 0 ||
            gasPrice
              .sub(tableDataList[tableDataList.length - 1].gasPrice)
              .gt(wei_10)
          ) {
            tableDataList.push({
              gasPrice,
              gasPriceStr: `${utils.etherUtils.formatUnits(
                gasPrice,
                "gwei"
              )} gwei`,
              amount: 1,
            });
          } else {
            tableDataList[tableDataList.length - 1].amount += 1;
          }
        });
      this.tableDataList = tableDataList as any;
      this.gasPrice = this.state.home.gasPriceList[2]
        .div(wei_10)
        .mul(wei_10)
        .add(wei_10);
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

