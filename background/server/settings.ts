import type {
  SetSettingStateParams,
  SettingDetails,
  SettingState,
  SettingToggle,
  Settings,
} from "../types/api"
import type { SettingsMessage } from "../types/bridge"
import { Server, type Handler, type ServerHandlers } from "./server"
import { Storage } from "./storage"

type SettingHandler = (details: SettingDetails) => void

type SettingDetailsHandler = {
  details: SettingDetails
  handler: SettingHandler
}

class IServerSettings implements Settings, ServerHandlers {
  private settings: SettingDetailsHandler[] = [
    {
      details: {
        infos: {
          category: "Gnoweb Tweaks",
          name: "Direct transaction on Realms help",
          help: "This add a button to make a transaction directly from a Realm help page on Gnoweb",
        },
        state: {
          state: { toggle: true },
          disabled: false,
        },
      },
      handler: (details) => {
        if ((details.state.state as SettingToggle).toggle == true) {
          Server.addContentScript({
            name: details.infos.name,
            file: "scripts/gnowebTxButton.js",
            match: /^.+\/r\/.+\?help/, // Gnoweb help page url
          })
        } else {
          Server.removeContentScript(details.infos.name)
        }
      },
    },
  ]
  private settingMap: Map<string, SettingDetailsHandler> = new Map()

  async getSettingList(): Promise<SettingDetails[]> {
    return ServerSettings.settings.map((item) => item.details)
  }

  async getSettingState(name: string): Promise<SettingState> {
    return ServerSettings.settingMap.get(name)!.details.state
  }

  async setSettingState(params: SetSettingStateParams): Promise<void> {
    const setting = ServerSettings.settingMap.get(params.name)!
    setting.details.state = params.state
    setting.handler(setting.details)
    await ServerSettings.persistSettingsStateToStorage()
  }

  private async persistSettingsStateToStorage() {
    const settingsState: SetSettingStateParams[] = []
    for (const setting of ServerSettings.settings) {
      settingsState.push({
        name: setting.details.infos.name,
        state: setting.details.state,
      })
    }
    await Storage.writeSettingsState("SettingsState", settingsState)
  }

  private async retrieveSettingsStateFromStorage() {
    const settingsState = await Storage.readSettingsState("SettingsState")

    if (settingsState == undefined) return

    for (const settingState of settingsState) {
      const setting = ServerSettings.settingMap.get(settingState.name)

      if (setting == undefined) continue

      setting.details.state = settingState.state
    }
  }

  handlers(): Map<SettingsMessage, Handler> {
    const heterogeneous: Map<SettingsMessage, Handler> = new Map()

    heterogeneous.set("SettingList", this.getSettingList)
    heterogeneous.set("SettingGetState", this.getSettingState)
    heterogeneous.set("SettingSetState", this.setSettingState)

    return heterogeneous
  }

  init() {
    // Init each setting
    for (const setting of this.settings) {
      setting.handler(setting.details)
    }
  }

  constructor() {
    for (const setting of this.settings) {
      // Add setting for faster access
      const name = setting.details.infos.name
      if (this.settingMap.has(name)) {
        console.error(`Setting with this name already exists : ${name}`)
      } else {
        this.settingMap.set(name, setting)
      }
    }

    this.retrieveSettingsStateFromStorage()
  }
}

export const ServerSettings = new IServerSettings()
