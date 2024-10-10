import type { SetSettingStateParams } from "../types/api"

export const StorageKeys = [
  "WalletCurrent",
  "WalletList",
  "ProviderCurrent",
  "ProviderList",
  "SettingsState",
] as const
export type StorageKey = (typeof StorageKeys)[number]

export namespace Storage {
  export const readString = async (
    key: StorageKey,
  ): Promise<string | undefined> => {
    const value = await chrome.storage.local.get(key)
    if (value && (value[key] as string)) {
      return value[key] as string
    }
  }

  export const writeString = async (
    key: StorageKey,
    value: string,
  ): Promise<void> => {
    await chrome.storage.local.set({ [key]: value })
  }

  export const readMapString = async (
    key: StorageKey,
  ): Promise<Map<string, string> | undefined> => {
    const value = await chrome.storage.local.get(key)
    if (value && value[key]) {
      return new Map(Object.entries(value[key]))
    }
  }

  export const writeMapString = async (
    key: StorageKey,
    value: Map<string, string>,
  ) => {
    await chrome.storage.local.set({ [key]: Object.fromEntries(value) })
  }

  export const readSettingsState = async (
    key: StorageKey,
  ): Promise<SetSettingStateParams[] | undefined> => {
    const value = await chrome.storage.local.get(key)
    if (value && value[key]) {
      return value[key] as SetSettingStateParams[]
    }
  }

  export const writeSettingsState = async (
    key: StorageKey,
    value: SetSettingStateParams[],
  ) => {
    await chrome.storage.local.set({ [key]: value })
  }
}
