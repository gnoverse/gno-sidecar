import type {
  SetSettingStateParams,
  SettingDetails,
  SettingState,
  Settings,
} from "../types/api"
import { sendToBackground } from "./client"

class IClientSettings implements Settings {
  async getSettingList(): Promise<SettingDetails[]> {
    return await sendToBackground("SettingList")
  }
  async getSettingState(name: string): Promise<SettingState> {
    return await sendToBackground("SettingGetState", name)
  }
  async setSettingState(state: SetSettingStateParams): Promise<void> {
    return await sendToBackground("SettingSetState", state)
  }
}

export const ClientSettings = new IClientSettings()
