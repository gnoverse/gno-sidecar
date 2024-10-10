import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import "./styles.css"
import {
  WalletScreen,
  InfoScreen,
  StatusScreen,
  SettingsScreen,
} from "./screens"

// Forward logs to background thread since popup thread can't access console
import "../utils/consoleProxy"

// Component displayed in the popup menu when extension icon is clicked
function Popup() {
  // Screen type enum
  enum Screen {
    Wallet,
    Info,
    Status,
    Settings,
  }

  // Selected screen state
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.Wallet)

  type ScreenProps = {
    screen: Screen
  }

  // Container component displaying the current screen
  const ScreenComponent = ({ screen }: ScreenProps) => {
    switch (screen) {
      case Screen.Wallet:
        return <WalletScreen />
      case Screen.Info:
        return <InfoScreen />
      case Screen.Status:
        return <StatusScreen />
      case Screen.Settings:
        return <SettingsScreen />
    }
  }

  // Bottom navigation component
  const NavButtonComponent = ({ screen }: ScreenProps) => {
    let icon: JSX.Element

    // Icons used in bottom naviagtion
    switch (screen) {
      case Screen.Wallet:
        icon = (
          <path d="m19,18c-1.379,0-2.5-1.121-2.5-2.5s1.121-2.5,2.5-2.5,2.5,1.121,2.5,2.5-1.121,2.5-2.5,2.5Zm2-14H5c-.856,0-1.653-.381-2.216-1.004.549-.607,1.335-.996,2.216-.996h18c.552,0,1-.448,1-1s-.448-1-1-1H5C2.239,0,0,2.239,0,5v10c0,2.761,2.239,5,5,5h8c.552,0,1-.448,1-1s-.448-1-1-1H5c-1.657,0-3-1.343-3-3V5s.002-.001.005-.002c.853.638,1.901,1.002,2.995,1.002h16c.552,0,1,.448,1,1v5c0,.552.448,1,1,1s1-.448,1-1v-5c0-1.657-1.343-3-3-3Zm-2,15c-2.333,0-4.375,1.538-4.966,3.741-.143.533.173,1.082.707,1.225.534.143,1.081-.173,1.225-.707.357-1.33,1.605-2.259,3.034-2.259s2.677.929,3.034,2.259c.12.447.524.741.965.741.085,0,.173-.011.26-.035.533-.143.85-.692.707-1.225-.591-2.203-2.633-3.741-4.966-3.741Z" />
        )
        break
      case Screen.Info:
        icon = (
          <g id="_01_align_center" data-name="01 align center">
            <path d="M12,24A12,12,0,1,1,24,12,12.013,12.013,0,0,1,12,24ZM12,2A10,10,0,1,0,22,12,10.011,10.011,0,0,0,12,2Z" />
            <path d="M14,19H12V12H10V10h2a2,2,0,0,1,2,2Z" />
            <circle cx="12" cy="6.5" r="1.5" />
          </g>
        )
        break
      case Screen.Status:
        icon = (
          <path d="m24,12c0,.552-.447,1-1,1h-2.466c-.452,0-.849.305-.966.74l-1.677,6.242c-.191.625-.725,1.018-1.341,1.018h-.017c-.623-.007-1.155-.415-1.324-1.014l-3.274-13.226-3.178,11.239c-.191.597-.69.976-1.28.999-.612.033-1.119-.315-1.345-.862l-1.6-4.474c-.143-.396-.521-.663-.942-.663H1c-.553,0-1-.448-1-1s.447-1,1-1h2.591c1.264,0,2.398.799,2.825,1.989l.938,2.626,3.284-11.615c.201-.625.727-1.027,1.361-1,.618.011,1.146.418,1.315,1.012l3.259,13.166,1.062-3.956c.351-1.308,1.542-2.222,2.897-2.222h2.466c.553,0,1,.448,1,1Z" />
        )
        break
      case Screen.Settings:
        icon = (
          <g>
            <path d="M1,4.75H3.736a3.728,3.728,0,0,0,7.195,0H23a1,1,0,0,0,0-2H10.931a3.728,3.728,0,0,0-7.195,0H1a1,1,0,0,0,0,2ZM7.333,2a1.75,1.75,0,1,1-1.75,1.75A1.752,1.752,0,0,1,7.333,2Z" />
            <path d="M23,11H20.264a3.727,3.727,0,0,0-7.194,0H1a1,1,0,0,0,0,2H13.07a3.727,3.727,0,0,0,7.194,0H23a1,1,0,0,0,0-2Zm-6.333,2.75A1.75,1.75,0,1,1,18.417,12,1.752,1.752,0,0,1,16.667,13.75Z" />
            <path d="M23,19.25H10.931a3.728,3.728,0,0,0-7.195,0H1a1,1,0,0,0,0,2H3.736a3.728,3.728,0,0,0,7.195,0H23a1,1,0,0,0,0-2ZM7.333,22a1.75,1.75,0,1,1,1.75-1.75A1.753,1.753,0,0,1,7.333,22Z" />
          </g>
        )
    }

    return (
      <button
        className={activeScreen === screen ? "active" : ""}
        onClick={() => setActiveScreen(screen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="currentColor"
        >
          {icon}
        </svg>
      </button>
    )
  }

  // Screen container + bottom navigation = popup component
  return (
    <div className="w-[350px] h-fit pb-16">
      <ScreenComponent screen={activeScreen} />

      <div className="btm-nav">
        <NavButtonComponent screen={Screen.Wallet} />
        <NavButtonComponent screen={Screen.Info} />
        <NavButtonComponent screen={Screen.Status} />
        <NavButtonComponent screen={Screen.Settings} />
      </div>
    </div>
  )
}

// Get root div element then render popup component inside it
const root = ReactDOM.createRoot(document.getElementById("root")!)

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
