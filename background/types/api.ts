import { type BroadcastTxCommitResult } from "@gnolang/tm2-js-client"

// Wallet API types
export type WalletProviderDetails = {
  wallet: string | undefined
  address: string
  account: number
  provider: string | undefined
  balance: number
}

export type CreateWalletParams = {
  name: string
  mnemonic: string
}

export type CreateProviderParams = {
  name: string
  address: string
}

export type CallMethodParams = {
  path: string | undefined
  method: string | undefined
  remote: string | undefined
  args: string[] | null
  gasFee: string | undefined
  gasWanted: string | undefined
}

export type Wallet = {
  getWalletProviderDetails(): Promise<WalletProviderDetails>
  getWalletList(): Promise<string[]>
  setCurrentWallet(name: string): Promise<void>
  createWallet(param: CreateWalletParams): Promise<void>
  removeWallet(name: string): Promise<void>
  getProviderList(): Promise<string[]>
  setCurrentProvider(name: string): Promise<void>
  createProvider(param: CreateProviderParams): Promise<void>
  removeProvider(name: string): Promise<void>
  callMethod(params: CallMethodParams): Promise<BroadcastTxCommitResult>
}

// Settings API types
export interface SettingToggle {
  toggle: boolean
}

export interface SettingSelect {
  choices: string[]
  selected: string
}

export interface SettingText {
  text: string
}

export type SettingInput = SettingToggle | SettingSelect | SettingText

export type SettingInfos = {
  name: string
  category: string
  help: string
}

export type SettingState = {
  state: SettingInput
  disabled: boolean | null
}

export type SettingDetails = {
  infos: SettingInfos
  state: SettingState
}

export type SetSettingStateParams = {
  name: string
  state: SettingState
}

export type Settings = {
  getSettingList(): Promise<SettingDetails[]>
  getSettingState(name: string): Promise<SettingState>
  setSettingState(state: SetSettingStateParams): Promise<void>
}

// Console API
export type Console = {
  debug(data: any[]): void
  log(data: any[]): void
  info(data: any[]): void
  warn(data: any[]): void
  error(data: any[]): void
}
