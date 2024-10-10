import { errToStr } from "../../utils/errors"
import {
  BackgroundMessages,
  type BackgroundMessage,
  type BackgroundResponse,
} from "../types/bridge"
import { ServerConsole } from "./console"
import { ServerSettings } from "./settings"
import { ServerWallet } from "./wallet"

export type Handler = Function
export type HandlerMap = Map<BackgroundMessage, Handler>
export type ServerHandlers = { handlers(): HandlerMap }

export type ContentScript = {
  name: string
  file: string
  match: RegExp
}

class IServer {
  private handlers: HandlerMap = new Map([
    ...ServerWallet.handlers().entries(),
    ...ServerSettings.handlers().entries(),
    ...ServerConsole.handlers().entries(),
  ])

  private contentScripts: Map<string, ContentScript> = new Map()

  addContentScript(cs: ContentScript): void {
    this.contentScripts.set(cs.name, cs)
  }

  removeContentScript(name: string): void {
    this.contentScripts.delete(name)
  }

  private setContentScriptInjecter(): void {
    chrome.webNavigation.onDOMContentLoaded.addListener(
      // Each time a page is loaded, this will be called
      async ({ tabId, url }) => {
        let files: string[] = []

        // List all scripts with a regex matching this url
        for (const [_, script] of this.contentScripts) {
          if (script.match.test(url)) {
            files.push(script.file)
          }
        }

        // Stop here if no matching script found
        if (files.length == 0) return

        try {
          // Inject the corresponding script in the page
          const result = await chrome.scripting.executeScript({
            target: { tabId },
            files: files,
          })
          console.debug("Injection result :", result)
        } catch (err) {
          console.error(`Failed to execute script: ${err}`)
        }
      },
    )
  }

  private setCleanupEventHandler(): void {
    chrome.runtime.onSuspend.addListener(() => {
      console.info("Unloading background script")
      ServerWallet.disconnectFromProvider()
    })
  }

  // Listen for messages fron runtime and route them to the handler
  // corresponding to their type
  private listenForMessages(): void {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      const { type, data } = message
      const handler = this.handlers.get(type)

      let response: BackgroundResponse = {
        error: undefined,
        response: undefined,
      }

      // Check if handler for this message type has been set
      if (handler) {
        try {
          let result = handler(data)
          // If the handler returns a promise, return true to notify runtime
          // that it needs to wait for data that will be sent through
          // sendResponse() when the promise will resolve
          if (result instanceof Promise) {
            ;(async () => {
              try {
                response.response = await result
              } catch (err) {
                response.error = errToStr(err)
              }
              sendResponse(response)
            })()
            return true
          }
          response.response = result
        } catch (err) {
          response.error = errToStr(err)
        }
      } else {
        response.error = `No handler set for message of type <${type}> with data: ${data}`
      }
      sendResponse(response)
    })
  }

  init() {
    // Init settings
    ServerSettings.init()

    // Check if a message handler is missing
    for (const message of BackgroundMessages) {
      if (!this.handlers.has(message)) {
        console.error(`No handler set for message : ${message}`)
      }
    }

    // Listen for messages from runtime
    this.listenForMessages()

    // Handle each new page loaded with content script injector
    this.setContentScriptInjecter()

    // Cleanup function called when background script is unloaded
    this.setCleanupEventHandler()
  }
}

export const Server = new IServer()
