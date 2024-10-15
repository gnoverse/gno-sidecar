import type {
  Wallet,
  WalletProviderDetails,
  CreateWalletParams,
  CreateProviderParams,
  CallMethodParams,
} from "../types/api"
import type { WalletMessage } from "../types/bridge"
import type { Handler, ServerHandlers } from "./server"
import { Storage } from "./storage"
import {
  GnoWallet,
  type GnoProvider,
  GnoWSProvider,
  GnoJSONRPCProvider,
} from "@gnolang/gno-js-client"
import {
  TransactionEndpoint,
  type BroadcastTxCommitResult,
} from "@gnolang/tm2-js-client"
import Long from "long"
import normalizeUrl from "normalize-url"

type WalletValue = {
  name: string
  gnoWallet: GnoWallet
}

type ProviderValue = {
  name: string
  gnoProvider: GnoProvider
}

const newGnoProvider = (address: string): GnoProvider => {
  // Normalize address
  address = normalizeUrl(address)

  // Return the suitable GnoProvider for this address
  if (address.startsWith("wss://") || address.startsWith("ws://")) {
    return new GnoWSProvider(address)
  } else {
    return new GnoJSONRPCProvider(address)
  }
}

class IServerWallet implements Wallet, ServerHandlers {
  private walletMap: Map<string, string> = new Map()
  private walletCurrent: WalletValue | undefined
  private providerMap: Map<string, string> = new Map()
  private providerCurrent: ProviderValue | undefined

  async getWalletProviderDetails(_: void): Promise<WalletProviderDetails> {
    let details: WalletProviderDetails = {
      wallet: ServerWallet.walletCurrent?.name,
      address: "",
      account: -1,
      provider: ServerWallet.providerCurrent?.name,
      balance: -1,
    }

    try {
      details.address =
        (await ServerWallet.walletCurrent?.gnoWallet.getAddress()) || ""
    } catch (err) {
      console.debug("Unable to get address :", err)
    }
    try {
      details.account =
        (await ServerWallet.walletCurrent?.gnoWallet.getAccountNumber()) || -1
    } catch (err) {
      console.debug("Unable to get account number :", err)
    }
    try {
      details.balance =
        (await ServerWallet.walletCurrent?.gnoWallet.getBalance()) || -1
    } catch (err) {
      console.debug("Unable to get balance :", err)
    }

    return details
  }

  async getWalletList(_: void): Promise<string[]> {
    return [...ServerWallet.walletMap.keys()].sort()
  }

  async setCurrentWallet(name: string): Promise<void> {
    // Ignore if wallet is already set as current
    if (name == ServerWallet.walletCurrent?.name) return

    // Check if wallet exists in wallet list
    const mnemonic = ServerWallet.walletMap.get(name)
    if (mnemonic) {
      // Instanciate a gnoWallet based on the associated mnemonic
      ServerWallet.walletCurrent = {
        name: name,
        gnoWallet: await GnoWallet.fromMnemonic(mnemonic),
      }

      // Persist wallet as current on the storage
      await Storage.writeString("WalletCurrent", name)

      // Connect current wallet to provider
      ServerWallet.connectToProvider()
    }
  }

  async createWallet({ name, mnemonic }: CreateWalletParams): Promise<void> {
    // Trim params
    name = name.trim()
    mnemonic = mnemonic.trim()

    // Check if a wallet with this name already exists
    if (ServerWallet.walletMap.has(name)) {
      throw new Error("Wallet name already exists")
    }

    if (name.length < 1) {
      throw new Error("Wallet name should be at least 1 letter")
    }

    // Check if a gnowallet can be created from this mnemonic
    await GnoWallet.fromMnemonic(mnemonic)

    // Append wallet to the list
    ServerWallet.walletMap.set(name, mnemonic)

    // Persist updated list on the storage
    await Storage.writeMapString("WalletList", ServerWallet.walletMap)
  }

  async removeWallet(name: string): Promise<void> {
    // Remove wallet from the list
    if (ServerWallet.walletMap.delete(name)) {
      // If removed wallet was current wallet, set current as first map entry
      // or undefined if map is empty
      if (ServerWallet.walletCurrent?.name == name) {
        if (ServerWallet.walletMap.size > 0) {
          ServerWallet.setCurrentWallet(
            ServerWallet.walletMap.keys().next().value,
          )
        } else {
          ServerWallet.walletCurrent = undefined
        }
      }

      // Persist updated list on storage
      await Storage.writeMapString("WalletList", ServerWallet.walletMap)
    }
  }

  async getProviderList(_: void): Promise<string[]> {
    return [...ServerWallet.providerMap.keys()].sort()
  }

  async setCurrentProvider(name: string): Promise<void> {
    // Ignore if provider is already set as current
    if (name == ServerWallet.providerCurrent?.name) return

    // Check if provider exists in provider list
    const address = ServerWallet.providerMap.get(name)
    if (address) {
      // Instanciate a gnoProvider based on the associated address
      ServerWallet.providerCurrent = {
        name: name,
        gnoProvider: newGnoProvider(address),
      }

      // Persist provider as current on the storage
      await Storage.writeString("ProviderCurrent", name)

      // Connect current wallet to provider
      ServerWallet.connectToProvider()
    }
  }

  async createProvider({ name, address }: CreateProviderParams): Promise<void> {
    // Trim params
    name = name.trim()
    address = address.trim()

    // Check if a provider with this name already exists
    if (ServerWallet.providerMap.has(name)) {
      throw new Error("Provider name already exists")
    }

    if (name.length < 1) {
      throw new Error("Provider name should be at least 1 letter")
    }

    // Check if a gnoProvider can be created from this address
    await newGnoProvider(address).getStatus()

    // Append provider to the list
    ServerWallet.providerMap.set(name, address)

    // Persist updated list on the storage
    await Storage.writeMapString("ProviderList", ServerWallet.providerMap)
  }

  async removeProvider(name: string): Promise<void> {
    // Remove provider from the list
    if (ServerWallet.providerMap.delete(name)) {
      // If removed provider was current provider, disconnect then
      // set current as first map entry or undefined if map is empty
      if (ServerWallet.providerCurrent?.name == name) {
        ServerWallet.disconnectFromProvider()
        if (ServerWallet.providerMap.size > 0) {
          ServerWallet.setCurrentProvider(
            ServerWallet.providerMap.keys().next().value,
          )
        } else {
          ServerWallet.providerCurrent = undefined
        }
      }

      // Persist updated list on storage
      await Storage.writeMapString("ProviderList", ServerWallet.providerMap)
    }
  }

  async callMethod(params: CallMethodParams): Promise<BroadcastTxCommitResult> {
    if (!ServerWallet.walletCurrent) {
      throw "No wallet currently selected"
    }

    let providerChanged: boolean = false
    try {
      // If specific provider was requested in params
      if (params.remote) {
        const requestedAddress = normalizeUrl(params.remote)
        const currentAddress = ServerWallet.providerMap.get(
          ServerWallet.providerCurrent?.name || "",
        )
        if (requestedAddress != currentAddress) {
          providerChanged = true

          // Temporarly disconnect wallet from selected provider
          ServerWallet.disconnectFromProvider()

          // Then connect to requested one
          ServerWallet.walletCurrent.gnoWallet.connect(
            newGnoProvider(requestedAddress),
          )
        }
      }

      const result = await ServerWallet.walletCurrent.gnoWallet.callMethod(
        params.path || "",
        params.method || "",
        params.args,
        TransactionEndpoint.BROADCAST_TX_COMMIT,
        undefined,
        {
          gasFee: params.gasFee || "",
          gasWanted: Long.fromString(params.gasWanted || ""),
        },
      )

      // Reconnect to selected provider
      if (providerChanged) {
        ServerWallet.disconnectFromProvider()
        ServerWallet.connectToProvider()
      }

      return result
    } catch (err) {
      // Reconnect to selected provider before throwing
      if (providerChanged) {
        ServerWallet.disconnectFromProvider()
        ServerWallet.connectToProvider()
      }
      throw err
    }
  }

  handlers(): Map<WalletMessage, Handler> {
    const heterogeneous: Map<WalletMessage, Handler> = new Map()

    heterogeneous.set("WalletProviderGetDetails", this.getWalletProviderDetails)
    heterogeneous.set("WalletList", this.getWalletList)
    heterogeneous.set("WalletSetCurrent", this.setCurrentWallet)
    heterogeneous.set("WalletAdd", this.createWallet)
    heterogeneous.set("WalletRemove", this.removeWallet)
    heterogeneous.set("ProviderList", this.getProviderList)
    heterogeneous.set("ProviderSetCurrent", this.setCurrentProvider)
    heterogeneous.set("ProviderAdd", this.createProvider)
    heterogeneous.set("ProviderRemove", this.removeProvider)
    heterogeneous.set("CallMethod", this.callMethod)

    return heterogeneous
  }

  // disconnectFromProvider tries to disconnect current wallet from its provider
  // if any and only if provider is using WebSocket
  disconnectFromProvider(): void {
    try {
      if (ServerWallet.walletCurrent) {
        const provider = ServerWallet.walletCurrent.gnoWallet.getProvider()
        // Check if provider uses WebSocket and not HTTP
        if (provider instanceof GnoWSProvider) {
          provider.closeConnection()
        }
        ServerWallet.walletCurrent.gnoWallet.connect(new GnoJSONRPCProvider(""))
      }
    } catch (err) {
      console.error("Unable to disconnect from provider :", err)
    }
  }

  // connectToProvider tries to connect current wallet and current provider if any
  private connectToProvider(): void {
    if (this.walletCurrent && this.providerCurrent) {
      try {
        this.walletCurrent.gnoWallet.connect(this.providerCurrent.gnoProvider)
      } catch (err) {
        console.error("Unable to connect to provider :", err)
      }
    }
  }

  private async readWalletList(): Promise<void> {
    try {
      this.walletMap = (await Storage.readMapString("WalletList")) || new Map()
    } catch (err) {
      console.error("Unable to read wallet list :", err)
    }
  }

  private async readWalletCurrent(): Promise<void> {
    try {
      const wallet = await Storage.readString("WalletCurrent")
      if (wallet) {
        const mnemonic = this.walletMap.get(wallet)
        if (mnemonic) {
          this.walletCurrent = {
            name: wallet,
            gnoWallet: await GnoWallet.fromMnemonic(mnemonic),
          }
          return
        }
      }
    } catch (err) {
      console.error("Unable to read current wallet :", err)
    }
    this.walletCurrent = undefined
  }

  private async readProviderList(): Promise<void> {
    try {
      this.providerMap =
        (await Storage.readMapString("ProviderList")) || new Map()
    } catch (err) {
      console.error("Unable to read provider list :", err)
    }
  }

  private async readProviderCurrent(): Promise<void> {
    try {
      const provider = await Storage.readString("ProviderCurrent")
      if (provider) {
        const address = this.providerMap.get(provider)
        if (address) {
          this.providerCurrent = {
            name: provider,
            gnoProvider: newGnoProvider(address),
          }
          return
        }
      }
    } catch (err) {
      console.error("Unable to read current provider :", err)
    }
    this.providerCurrent = undefined
  }

  private async setInitialValues() {
    const defaultWallets: Map<string, string> = new Map([
      [
        "Test1",
        "source bonus chronic canvas draft south burst lottery vacant surface solve popular case indicate oppose farm nothing bullet exhibit title speed wink action roast",
      ],
    ])
    const defaultProviders: Map<string, string> = new Map([
      ["Portal Loop", "https://rpc.gno.land:443"],
      ["Portal Loop (WebSocket)", "wss://rpc.gno.land:443/websocket"],
      ["Test4", "https://rpc.test4.gno.land:443"],
      ["Test4 (WebSocket)", "wss://rpc.test4.gno.land:443/websocket"],
      ["Test3", "https://rpc.test3.gno.land:443"],
      ["Test3 (WebSocket)", "wss://rpc.test3.gno.land:443/websocket"],
      ["Staging", "https://rpc.staging.gno.land:443"],
      ["Staging (WebSocket)", "wss://rpc.staging.gno.land:443/websocket"],
    ])

    await Storage.writeMapString("WalletList", defaultWallets)
    await Storage.writeMapString("ProviderList", defaultProviders)
    await Storage.writeString(
      "WalletCurrent",
      defaultWallets.keys().next().value,
    )
    await Storage.writeString(
      "ProviderCurrent",
      defaultProviders.keys().next().value,
    )
  }

  async init() {
    if ((await Storage.readBoolean("InitWalletDefault")) != true) {
      await this.setInitialValues()
      await Storage.writeBoolean("InitWalletDefault", true)
    }

    await this.readWalletList()
    await this.readWalletCurrent()
    await this.readProviderList()
    await this.readProviderCurrent()

    this.connectToProvider()
  }
}

const asyncContructor = new IServerWallet()
await asyncContructor.init()

export const ServerWallet = asyncContructor
