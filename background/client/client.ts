import {
  type BackgroundMessage,
  type BackgroundResponse,
} from "../types/bridge"

export { ClientWallet } from "./wallet"
export { ClientSettings } from "./settings"
export { ClientConsole } from "./console"

export async function sendToBackground(
  type: BackgroundMessage,
  data: any = null,
): Promise<any> {
  const response: BackgroundResponse = await chrome.runtime.sendMessage({
    type,
    data,
  })
  if (response.error) {
    console.error("Got error from background :", response.error)
    throw new Error(response.error)
  }
  return response.response
}
