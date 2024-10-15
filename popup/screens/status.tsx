import { useState } from "react"

export default function StatusScreen() {
  const [loading, setLoading] = useState<boolean>(true)

  return (
    <div className="flex items-center justify-center h-[600px]">
      {loading ? (
        <span className="loading loading-ring loading-lg"></span>
      ) : undefined}
      <iframe
        className="h-[660px] w-full mt-[-200px]"
        id="status_iframe"
        src="https://status.gnoteam.com"
        onLoad={() => setLoading(false)}
        style={{
          display: loading ? "none" : "block",
        }}
      ></iframe>
    </div>
  )
}
