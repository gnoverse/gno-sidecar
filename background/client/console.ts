import type { Console } from "../types/api"
import { sendToBackground } from "./client"

class IClientConsole implements Console {
  debug(...data: any[]): void {
    sendToBackground("ConsoleDebug", data)
  }
  log(...data: any[]): void {
    sendToBackground("ConsoleLog", data)
  }
  info(...data: any[]): void {
    sendToBackground("ConsoleInfo", data)
  }
  warn(...data: any[]): void {
    sendToBackground("ConsoleWarn", data)
  }
  error(...data: any[]): void {
    sendToBackground("ConsoleError", data)
  }
}

export const ClientConsole = new IClientConsole()
