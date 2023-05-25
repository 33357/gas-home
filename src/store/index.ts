import { ActionTree, createStore } from "vuex";
import { Ether } from "../network";
import { BigNumber, utils, log } from "../const";
import { toRaw } from "vue";
import { ElMessage, ElNotification } from "element-plus";

export interface Storage {}

export interface Home {
  userAddress: string;
  chainId: number;
  timestamp: number;
  ether: Ether;
  gasPriceList: {
    gasPrice: BigNumber;
    timestamp: number;
    blockNumber: number;
  }[];
  blockTime: { [chainId: number]: number };
}

export interface Storage {
  gasLimitInput: string;
  waitTimeInput: string;
  waitTimeSelect: string;
}

export interface State {
  home: Home;
  storage: Storage;
}

const state: State = {
  home: {
    userAddress: utils.num.min,
    chainId: 0,
    timestamp: 0,
    ether: new Ether(),
    gasPriceList: [],
    blockTime: {
      1: 12,
      56: 3,
      137: 2,
    },
  },
  storage: {
    gasLimitInput: "",
    waitTimeInput: "",
    waitTimeSelect: "1",
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
  async start({ dispatch }, { chainId }) {
    try {
      await toRaw(state.home.ether).load(chainId);
      if (state.home.ether.singer && state.home.ether.chainId) {
        state.home.userAddress = await toRaw(
          state.home.ether.singer
        ).getAddress();
        state.home.chainId = state.home.ether.chainId;
      }
      await dispatch("watchStorage");
      log("app start success!");
    } catch (error) {
      err(error);
    }
  },

  async watchStorage({ state }) {
    const storageName = `${state.home.chainId}`;
    try {
      const storage = localStorage.getItem(storageName);
      if (storage) {
        utils.deep.clone(state.storage, JSON.parse(storage));
      } else {
        throw new Error("localStorage is empty!");
      }
    } catch (err) {
      localStorage.setItem(storageName, JSON.stringify(state.storage));
    }
    this.watch(
      (state) => state.storage,
      (storage) => {
        localStorage.setItem(storageName, JSON.stringify(storage));
      },
      {
        deep: true,
      }
    );
  },

  async estimateGasPrice({ state }, { gasLimit, waitTime }) {
    if (state.home.ether.web3 && state.home.ether.provider) {
      let blockNumber = await toRaw(state.home.ether.provider).getBlockNumber();
      const block = await toRaw(state.home.ether.provider).getBlock(
        blockNumber
      );
      state.home.timestamp = block.timestamp;
      const blockAmount = Math.ceil(
        waitTime / state.home.blockTime[state.home.chainId]
      );
      const PromiseList: any[] = [];
      for (let i = 0; ; i += 1024) {
        if (blockAmount - i < 1024) {
          PromiseList.push(
            toRaw(state.home.ether.web3.eth).getFeeHistory(
              blockAmount - i,
              blockNumber - i,
              [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
            )
          );
          break;
        }
        PromiseList.push(
          toRaw(state.home.ether.web3.eth).getFeeHistory(
            1024,
            blockNumber - i,
            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
          )
        );
      }
      const feeHistoryList = await Promise.all(PromiseList);
      const gasPriceList: {
        gasPrice: BigNumber;
        timestamp: number;
        blockNumber: number;
      }[] = [];
      for (let j = 0; j < feeHistoryList.length; j++) {
        let oldestBlockNumber = BigNumber.from(
          feeHistoryList[j].oldestBlock
        ).toNumber();
        for (let i = 0; i < feeHistoryList[j].gasUsedRatio.length; i++) {
          const baseFeePerGas = BigNumber.from(
            feeHistoryList[j].baseFeePerGas[i]
          );
          let pet =
            (gasLimit * 100) / (30000000 * feeHistoryList[j].gasUsedRatio[i]);
          if (pet > 100) {
            pet = 100;
          }
          const priorityFeePerGas = BigNumber.from(
            feeHistoryList[j].reward[i][Math.ceil(pet / 10) - 1]
          );
          const gasPrice = baseFeePerGas.add(priorityFeePerGas);
          const thisBlockNumber = oldestBlockNumber + i;
          gasPriceList.push({
            gasPrice,
            blockNumber: thisBlockNumber,
            timestamp:
              state.home.timestamp -
              (blockNumber - thisBlockNumber) *
                state.home.blockTime[state.home.chainId],
          });
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
