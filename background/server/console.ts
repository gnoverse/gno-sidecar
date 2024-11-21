import type { Console } from "../types/api"
import type { ConsoleMessage } from "../types/bridge"
import type { Handler, ServerHandlers } from "./server"

class IServerConsole implements Console, ServerHandlers {
  debug(data: any[]): void {
    console.debug(data[0], ...data.slice(1))
  }
  log(data: any[]): void {
    console.log(data[0], ...data.slice(1))
  }
  info(data: any[]): void {
    console.info(data[0], ...data.slice(1))
  }
  warn(data: any[]): void {
    console.warn(data[0], ...data.slice(1))
  }
  error(data: any[]): void {
    console.error(data[0], ...data.slice(1))
  }

  handlers(): Map<ConsoleMessage, Handler> {
    return new Map([
      ["ConsoleDebug", this.debug],
      ["ConsoleLog", this.log],
      ["ConsoleInfo", this.info],
      ["ConsoleWarn", this.warn],
      ["ConsoleError", this.error],
    ])
  }
}

export const ServerConsole = new IServerConsole()
