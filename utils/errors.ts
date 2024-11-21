export const errToStr = (err: any): string => {
  return `${err}`.replace(/^(Error:)/, "")
}
