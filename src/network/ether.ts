import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import { ethers, Signer, providers, Wallet } from "ethers";

export class Ether {
  public ethereum: any;

  public web3: Web3 | undefined;

  public singer: Signer | undefined;

  public provider: providers.Web3Provider | undefined;

  public chainId: number | undefined;

  async load(chainId: number) {
    this.ethereum = (await detectEthereumProvider()) as any;
    if (this.ethereum) {
      this.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
      this.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      await this.ethereum.request({ method: "eth_requestAccounts" });
      this.web3 = new Web3(this.ethereum);
      this.provider = new ethers.providers.Web3Provider(this.ethereum);
      this.singer = this.provider.getSigner();
      this.chainId = await this.singer.getChainId();
      if (this.chainId != chainId) {
        await this.changeChain(chainId);
      }
      if (this.chainId != 1 && this.chainId != 137) {
        await this.changeChain(1);
      }
    } else {
      throw "Please use a browser that supports web3 to open";
    }
  }

  async changeChain(chainId: number) {
    if (chainId == 1 || chainId == 56 || chainId == 137) {
      await this.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
          },
        ],
      });
    }
  }
}
