import { ClientConsole } from "../background/client/client"

// Import this file to forward all logs to background thread console.
// Use cases :
// - log from the popup thread that doesn't have access to the console
// - centralize logs from scripts injected into pages into one console
console.debug = (...data: any[]) => ClientConsole.debug(...data)
console.log = (...data: any[]) => ClientConsole.log(...data)
console.info = (...data: any[]) => ClientConsole.info(...data)
console.warn = (...data: any[]) => ClientConsole.warn(...data)
console.error = (...data: any[]) => ClientConsole.error(...data)
