<template>
  <div>
    <el-card class="box-card">
      <el-form label-width="30%">
        <el-form-item label="GasLimit :">
          <el-input v-model="state.gas.gasLimitInput" type="string"> </el-input>
        </el-form-item>
        <el-form-item label="WaitTime :">
          <el-input v-model="state.gas.waitTimeInput" class="input-with-select">
            <template #append>
              <el-select
                v-model="state.gas.waitTimeSelect"
                placeholder="Select"
                style="width: 115px"
              >
                <el-option label="Minute" value="1" />
                <el-option label="Hour" value="2" />
                <el-option label="Day" value="3" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="doEstimate()" :loading="estimateLoad">Estimate</el-button>
        </el-form-item>
      </el-form>
      <el-divider />
      <el-form label-width="30%">
        <el-form-item label="Lowest GasPrice :">
          <div>
            {{ `${utils.etherUtils.formatUnits(gasPrice, "gwei")} gwei` }}
          </div>
        </el-form-item>
        <el-form-item label="Block Amount:">
          <div>
            {{ state.home.gasPriceList.length }}
          </div>
        </el-form-item>
      </el-form>
      <el-divider />
      <el-table :data="tableDataList" stripe style="width: 100%">
        <el-table-column prop="gasPriceStr" label="GasPrice" width="300" />
        <el-table-column prop="amount" label="Amount" />
        <el-table-column prop="time" label="Time" />
      </el-table>
    </el-card>
  </div>
</template>

<script lang="ts">
import { BigNumber, utils, log, formatTime } from "../const";
import { mapState, mapActions } from "vuex";
import { State, err } from "../store";

export default {
  data() {
    return {
      utils: utils,
      gasPrice: BigNumber.from(0),
      estimateLoad: false,
      tableDataList: [],
    };
  },
  async created() { },
  computed: mapState({
    state: (state: any) => state as State,
  }),
  methods: {
    ...mapActions(["estimateGasPrice"]),
    async doEstimate() {
      try {
        let waitTime = Number(this.state.gas.waitTimeInput);
        const gasLimit = Number(this.state.gas.gasLimitInput);
        if (this.state.gas.waitTimeSelect == "1") {
          waitTime *= 60;
        } else if (this.state.gas.waitTimeSelect == "2") {
          waitTime *= 60 * 60;
        } else if (this.state.gas.waitTimeSelect == "3") {
          waitTime *= 60 * 60 * 24;
        }
        if (gasLimit > 30000000 || gasLimit == 0) {
          throw new Error("error gasLimit");
        }
        if (waitTime < 60) {
          throw new Error("error waitTime");
        }
        this.estimateLoad = true;
        this.tableDataList = [];
        this.gasPrice = BigNumber.from(0);
        await this.estimateGasPrice({
          gasLimit,
          waitTime,
        });
        this.estimateLoad = false;
        const wei_10 = BigNumber.from(10 ** 8);
        const tableDataList: {
          gasPrice: BigNumber;
          gasPriceStr: string;
          amount: number;
          time: string;
          timestamp: number;
        }[] = [];
        this.state.home.gasPriceList
          .sort((a, b) => {
            return a.gasPrice.gt(b.gasPrice) ? 1 : -1;
          })
          .forEach((e) => {
            let gasPrice = e.gasPrice.div(wei_10).mul(wei_10);
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
                time: formatTime(this.state.home.timestamp - e.timestamp),
                timestamp: e.timestamp
              });
            } else {
              tableDataList[tableDataList.length - 1].amount += 1;
              if (e.timestamp > tableDataList[tableDataList.length - 1].timestamp) {
                tableDataList[tableDataList.length - 1].time = formatTime(this.state.home.timestamp - e.timestamp)
              }
            }
          });
        this.tableDataList = tableDataList as any;
        this.gasPrice = this.state.home.gasPriceList[1].gasPrice
          .div(wei_10)
          .mul(wei_10)
          .add(wei_10);
      } catch (error) {
        err(error);
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
