export interface BackgroundResponse {
  error: string | undefined
  response: any
}

export const WalletMessages = [
  "WalletProviderGetDetails",
  "WalletList",
  "WalletSetCurrent",
  "WalletAdd",
  "WalletRemove",
  "ProviderList",
  "ProviderSetCurrent",
  "ProviderAdd",
  "ProviderRemove",
  "CallMethod",
] as const
export type WalletMessage = (typeof WalletMessages)[number]

export const SettingsMessages = [
  "SettingList",
  "SettingGetState",
  "SettingSetState",
] as const
export type SettingsMessage = (typeof SettingsMessages)[number]

export const ConsoleMessages = [
  "ConsoleLog",
  "ConsoleDebug",
  "ConsoleInfo",
  "ConsoleWarn",
  "ConsoleError",
] as const
export type ConsoleMessage = (typeof ConsoleMessages)[number]

export const BackgroundMessages = [
  ...WalletMessages.map((t) => t),
  ...SettingsMessages.map((t) => t),
  ...ConsoleMessages.map((t) => t),
] as const
export type BackgroundMessage = WalletMessage | SettingsMessage | ConsoleMessage
