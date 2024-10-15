import type { CallMethodParams } from "../background/types/api"
import { ClientWallet } from "../background/client/client"
import { injectStyleSheet } from "../utils/domInjection"
import { errToStr } from "../utils/errors"
import JSONFormatter from "json-formatter-js"
import { decode } from "js-base64"

const inject = () => {
  // Get realm_help element
  const divHelp = document.getElementById("realm_help")
  if (!divHelp) {
    return
  }

  // Append button + text output to each func
  for (const func of divHelp.getElementsByClassName("func_spec")) {
    // Get table body and insert it a row with header, output field and button
    const table = func.getElementsByTagName("table")[0]
    table.style.width = "100%"

    // Insert after contract, params and results but before command
    const row = table.insertRow(3)
    row.className = "call_method"

    const header = document.createElement("th")
    header.innerHTML = "call"
    row.append(header)

    const cell = document.createElement("td")
    const output = document.createElement("div")
    output.style.width = "100%"
    output.style.padding = "8px"
    output.style.maxWidth = "660px"
    output.style.minHeight = "32px"
    output.style.background = "white"
    output.innerHTML = "Output"
    output.style.color = "grey"
    cell.append(output)
    row.append(cell)

    const button = document.createElement("button")
    button.style.width = "80px"
    button.style.height = "34px"
    button.style.marginLeft = "16px"
    button.innerHTML = "Make Tx"
    button.style.color = "#1e1e1e"
    button.style.fontWeight = "bold"
    row.append(button)

    // Hide command help inside a details / summary block
    const details = document.createElement("details")
    const summary = document.createElement("summary")
    summary.innerHTML = "Help"
    details.append(summary)

    const commandRow = table.getElementsByClassName("command")[0]
    const commandCell = commandRow.getElementsByTagName("td")[0]
    const commandText = commandCell.getElementsByClassName(
      "shell_command",
    )[0] as HTMLDivElement
    commandText.style.marginTop = "16px"

    details.append(commandText)
    commandCell.append(details)

    // Import font-awesome
    injectStyleSheet(
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
    )

    // Parse command help text
    const parseCommand = (command: string): CallMethodParams => {
      const regex =
        /-pkgpath\s+"([^"]+)"|-func\s+"([^"]+)"|-remote\s+"([^"]+)"|-args\s+"([^"]*)"|-gas-fee\s+(\S+)|-gas-wanted\s+(\S+)/g
      const parsed = {} as CallMethodParams

      let match
      while ((match = regex.exec(command)) !== null) {
        if (match[1]) {
          parsed.path = match[1] // Capture pkgpath
        } else if (match[2]) {
          parsed.method = match[2] // Capture func
        } else if (match[3]) {
          parsed.remote = match[3] // Capture remote
        } else if (match[4] != null) {
          if (!parsed.args) parsed.args = []
          parsed.args.push(match[4]) // Capture args
        } else if (match[5]) {
          parsed.gasFee = match[5] // Capture gas-fee
        } else if (match[6]) {
          parsed.gasWanted = match[6] // Capture gas-wanted
        }
      }

      // In case remote is Gnodev, replace tcp by http
      parsed.remote = parsed.remote?.replace(/^tcp:\/\//, "http://")

      console.debug("Parsed command :", parsed)

      return parsed
    }

    // Retrieve command help text
    const getCommandText = (): string | undefined => {
      const span = commandText.getElementsByTagName("span")
      if (span && span.length >= 1) {
        return span[1].innerHTML
      }
    }

    // Bind an onClick handler to the button that :
    // - retrieves the command help text
    // - parses it to a CallMethodParams type
    // - run1e callMethod() on wallet selected in the background using client
    // - displays result or error in output text field
    button.addEventListener("click", async () => {
      button.disabled = true
      button.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'
      output.style.color = "grey"
      output.innerHTML = "Waiting for response..."

      const command = getCommandText()
      if (command) {
        const params = parseCommand(command)
        try {
          const result = await ClientWallet.callMethod(params)
          output.style.color = "#1e1e1e"

          // Decode and display results returned by the method
          const decoded = decode(result.deliver_tx.ResponseBase.Data || "")
          const decodedDetails = document.createElement("details")
          decodedDetails.style.overflowWrap = "anywhere"
          output.innerHTML = ""
          output.append(decodedDetails)

          const decodedSummary = document.createElement("summary")
          decodedSummary.innerHTML = "Decoded results"
          decodedSummary.style.fontWeight = "600"
          decodedDetails.append(decodedSummary)
          decodedDetails.append(decoded)
          decodedDetails.style.marginBottom = "8px"

          // Format to JSON then display the raw response
          const rawDetails = document.createElement("details")
          rawDetails.style.overflowWrap = "anywhere"
          output.append(rawDetails)

          const rawSummary = document.createElement("summary")
          rawSummary.innerHTML = "Raw Response"
          rawSummary.style.fontWeight = "600"
          rawDetails.append(rawSummary)

          const rawContainer = document.createElement("div")
          rawContainer.appendChild(new JSONFormatter(result, Infinity).render())
          rawDetails.append(rawContainer)

          // Make JSON text wrap if too long
          for (const jsonFormatterString of output.getElementsByClassName(
            "json-formatter-string",
          )) {
            ;(jsonFormatterString as HTMLSpanElement).style.whiteSpace =
              "normal"
          }

          console.info(
            `Call succeeded :\n\nDecoded :\n${decoded}\n\nJSON :\n${JSON.stringify(result, null, 4)}`,
          )
        } catch (err) {
          output.style.color = "#F00"
          output.innerHTML = errToStr(err)
          console.error(
            `Call failed for method <${params.method}>, with args <${params.args}> : ${errToStr(err)}`,
          )
        }
      } else {
        output.style.color = "#F00"
        output.innerHTML = "Can't retrive eommand help text!"
      }

      button.innerHTML = "Make Tx"
      button.disabled = false
    })
  }
}

inject()
