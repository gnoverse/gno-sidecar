import type {
  Wallet,
  WalletProviderDetails,
  CreateWalletParams,
  CreateProviderParams,
  CallMethodParams,
} from "../types/api"
import type { BroadcastTxCommitResult } from "@gnolang/tm2-js-client"
import { sendToBackground } from "./client"

class IClientWallet implements Wallet {
  async getWalletProviderDetails(): Promise<WalletProviderDetails> {
    return await sendToBackground("WalletProviderGetDetails")
  }
  async getWalletList(): Promise<string[]> {
    return await sendToBackground("WalletList")
  }
  async setCurrentWallet(name: string): Promise<void> {
    return await sendToBackground("WalletSetCurrent", name)
  }
  async createWallet(params: CreateWalletParams): Promise<void> {
    return await sendToBackground("WalletAdd", params)
  }
  async removeWallet(name: string): Promise<void> {
    return await sendToBackground("WalletRemove", name)
  }
  async getProviderList(): Promise<string[]> {
    return await sendToBackground("ProviderList")
  }
  async setCurrentProvider(name: string): Promise<void> {
    return await sendToBackground("ProviderSetCurrent", name)
  }
  async createProvider(params: CreateProviderParams): Promise<void> {
    return await sendToBackground("ProviderAdd", params)
  }
  async removeProvider(name: string): Promise<void> {
    return await sendToBackground("ProviderRemove", name)
  }
  async callMethod(params: CallMethodParams): Promise<BroadcastTxCommitResult> {
    return await sendToBackground("CallMethod", params)
  }
}

export const ClientWallet = new IClientWallet()
