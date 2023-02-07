import { ActionTree, createStore } from "vuex";
import { Ether } from "../network";
import { BigNumber, utils, log } from "../const";
import { toRaw } from "vue";
import { ElMessage, ElNotification } from "element-plus";

export interface Storage { }

export interface Home {
  userAddress: string;
  chainId: number;
  ether: Ether;
  gasPriceList: BigNumber[];
}

export interface State {
  home: Home;
}

const state: State = {
  home: {
    userAddress: utils.num.min,
    chainId: 0,
    ether: new Ether(),
    gasPriceList: [],
  },
};

export function err(error: any) {
  ElMessage({
    message: error.toString().split("(")[0],
    duration: 3000,
    type: "error",
  });
}

export function notification(
  title: string,
  message: string,
  type: "success" | "warning" | "info"
) {
  ElNotification({
    title,
    message,
    dangerouslyUseHTMLString: true,
    duration: 60000,
    offset: 50,
    type,
  });
}

const actions: ActionTree<State, State> = {
  async start({ dispatch }) {
    try {
      await dispatch("setSync");
      utils.func.log("app start success!");
    } catch (error) {
      err(error);
    }
  },

  async setSync({ state }) {
    await toRaw(state.home.ether).load();
    if (state.home.ether.singer) {
      state.home.userAddress = await toRaw(
        state.home.ether.singer
      ).getAddress();
    }
    if (state.home.ether.chainId) {
      state.home.chainId = state.home.ether.chainId;
    }
  },

  async estimateGasPrice({ state }, { gasLimit, waitTime }) {
    if (state.home.ether.web3 && state.home.ether.provider) {
      const blockNumber = await toRaw(
        state.home.ether.provider
      ).getBlockNumber();
      const blockAmount = Math.ceil(waitTime / 12);
      const PromiseList: any[] = [];
      for (let i = 0; ; i += 1024) {
        if (blockAmount - i < 1024) {
          PromiseList.push(toRaw(state.home.ether.web3.eth).getFeeHistory(
            blockAmount - i,
            blockNumber - i,
            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
          ))
          break;
        }
        PromiseList.push(toRaw(state.home.ether.web3.eth).getFeeHistory(
          1024,
          blockNumber - i,
          [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        ))
      }
      const feeHistoryList = await Promise.all(PromiseList);
      const gasPriceList: BigNumber[] = [];
      for (let j = 0; j < feeHistoryList.length; j++) {
        for (let i = 0; i < feeHistoryList[j].gasUsedRatio.length; i++) {
          const baseFeePerGas = BigNumber.from(feeHistoryList[j].baseFeePerGas[i]);
          let pet = (gasLimit * 100) / (30000000 * feeHistoryList[j].gasUsedRatio[i]);
          if (pet > 100) {
            pet = 100;
          }
          const index = Math.ceil(pet / 10) - 1;
          const priorityFeePerGas = BigNumber.from(feeHistoryList[j].reward[i][index]);
          const gasPrice = baseFeePerGas.add(priorityFeePerGas);
          gasPriceList.push(gasPrice);
        }
      }
      state.home.gasPriceList = gasPriceList;
    }
  },
};

export default createStore({
  state,
  actions,
});
