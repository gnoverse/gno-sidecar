export const getHead = (): HTMLHeadElement =>
  document.head || document.getElementsByTagName("head")[0]

export const injectStyleSheet = (href: string): void => {
  const link = document.createElement("link")
  link.type = "text/css"
  link.rel = "stylesheet"
  link.href = href
  getHead().appendChild(link)
}

export const injectStyleText = (styleText: string): void => {
  const style = document.createElement("style")
  style.appendChild(document.createTextNode(styleText))
  getHead().appendChild(style)
}
