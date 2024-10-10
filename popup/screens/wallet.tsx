import { useState, useEffect } from "react"
import { ClientWallet } from "../../background/client/client"
import { errToStr } from "../../utils/errors"

export default function WalletScreen() {
  // Loading state (to display a spinner while fetching infos)
  const [loading, setLoading] = useState<boolean>(true)

  const loadingWrapper = async (fetchingFunc: () => Promise<void>) => {
    setLoading(true)
    await fetchingFunc()
    setLoading(false)
  }

  // States related to wallet creation menu
  const [newWalletNameState, setNewWalletNameState] = useState<string>("")
  const [newWalletMnemonicState, setNewWalletMnemonicState] =
    useState<string>("")
  const [newWalletErrorState, setNewWalletErrorState] = useState<string>("")

  // States related to wallet details display
  const [currentWalletState, setCurrentWalletState] = useState<string>()
  const [walletListState, setWalletListState] = useState<string[]>([])
  const [walletAddressState, setWalletAddressState] = useState<string>("")
  const [accountNumberState, setAccountNumberState] = useState<number>(-1)

  // States related to provider creation menu
  const [newProviderNameState, setNewProviderNameState] = useState<string>("")
  const [newProviderAddressState, setNewProviderAddressState] =
    useState<string>("")
  const [newProviderErrorState, setNewProviderErrorState] = useState<string>("")

  // States related to provider details display
  const [currentProviderState, setCurrentProviderState] = useState<string>()
  const [providerListState, setProviderListState] = useState<string[]>([])
  const [balanceState, setBalanceState] = useState<number>(-1)

  // Getters that fetch info from background then update component states
  const getWalletProviderDetails = async () => {
    const details = await ClientWallet.getWalletProviderDetails()
    setCurrentWalletState(details.wallet)
    setWalletAddressState(details.address)
    setAccountNumberState(details.account)
    setCurrentProviderState(details.provider)
    setBalanceState(details.balance)
  }
  const getWalletList = async () => {
    setWalletListState(await ClientWallet.getWalletList())
  }
  const getProviderList = async () => {
    setProviderListState(await ClientWallet.getProviderList())
  }

  // States reseters
  const resetWalletInfos = () => {
    setWalletAddressState("")
    resetProviderInfos()
  }
  const resetProviderInfos = () => {
    setAccountNumberState(-1)
    setBalanceState(-1)
  }

  // Fetch initial component states from background / storage
  useEffect(() => {
    loadingWrapper(async () => {
      try {
        await getWalletList()
        await getProviderList()
        await getWalletProviderDetails()
      } catch (err) {
        console.error("Unable to fetch initial states :", err)
      }
    })
  }, [])

  // Dropdown select menus handlers
  const selectWallet: React.FormEventHandler<HTMLSelectElement> = async (
    selected: React.FormEvent<HTMLSelectElement>,
  ) => {
    await loadingWrapper(async () => {
      const wallet = selected.currentTarget.value

      try {
        await setWallet(wallet)
      } catch (err) {
        console.error(
          `Wallet selection failed with name <${wallet}> and error : ${err})`,
        )
      }
    })
  }
  const setWallet = async (name: string) => {
    // Reset related states
    resetWalletInfos()

    // Set current wallet then update states with updated details
    await ClientWallet.setCurrentWallet(name)
    await getWalletProviderDetails()
  }
  const selectProvider: React.FormEventHandler<HTMLSelectElement> = async (
    selected: React.FormEvent<HTMLSelectElement>,
  ) => {
    await loadingWrapper(async () => {
      const provider = selected.currentTarget.value

      try {
        await setProvider(provider)
      } catch (err) {
        console.error(
          `Provider selection failed with name <${provider}> and error : ${err})`,
        )
      }
    })
  }
  const setProvider = async (name: string) => {
    // Reset related states
    resetProviderInfos()

    // Set current provider then update states with updated details
    await ClientWallet.setCurrentProvider(name)
    await getWalletProviderDetails()
  }

  // Creation menus handlers
  const newWalletSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    // Prevent closing modal
    event.preventDefault()

    await loadingWrapper(async () => {
      setNewWalletErrorState("")
      try {
        // Create new wallet then select it and update states with updated details
        await ClientWallet.createWallet({
          name: newWalletNameState,
          mnemonic: newWalletMnemonicState,
        })
        await getWalletList()
        await setWallet(newWalletNameState)
        console.debug(
          `New wallet created with name <${newWalletNameState}> and mnemonic: ${newWalletMnemonicState}`,
        )

        // Close modal on success
        const modal = document.getElementById(
          "WalletAddModal",
        ) as HTMLDialogElement
        if (modal) {
          modal.close()
        }
      } catch (err) {
        setNewWalletErrorState(errToStr(err))
        console.error(
          `Wallet creation failed with error <${err})>, name <${newWalletNameState}> and mnemonic: ${newWalletMnemonicState}`,
        )
      }
    })
  }
  const newProviderSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    // Prevent closing modal
    event.preventDefault()

    await loadingWrapper(async () => {
      setNewProviderErrorState("")
      try {
        // Create new provider then select it and update states with updated details
        await ClientWallet.createProvider({
          name: newProviderNameState,
          address: newProviderAddressState,
        })
        await getProviderList()
        await setProvider(newProviderNameState)
        console.debug(
          `New provider created with name <${newProviderNameState}> and address: ${newProviderAddressState}`,
        )

        // Close modal on success
        const modal = document.getElementById(
          "ProviderAddModal",
        ) as HTMLDialogElement
        if (modal) {
          modal.close()
        }
      } catch (err) {
        setNewProviderErrorState(`${err}`.replace(/^(Error:)/, ""))
        console.error(
          `Provider creation failed with error <${err})>, name <${newProviderNameState}> and address: ${newProviderAddressState}`,
        )
      }
    })
  }

  // Remove buttons
  const removeCurrentWallet: React.MouseEventHandler<HTMLSpanElement> = async (
    _: React.MouseEvent<HTMLSpanElement, MouseEvent>,
  ) => {
    if (currentWalletState) {
      await removeWallet(currentWalletState)
    }
  }
  const removeWallet = async (name: string) => {
    try {
      // Reset related states
      resetWalletInfos()

      // Remove wallet then update states with updated details
      await ClientWallet.removeWallet(name)
      await getWalletList()
      await getWalletProviderDetails()
      console.debug(`Removed wallet with name <${name}>`)
    } catch (err) {
      console.error(
        `Wallet removal failed with error <${err})> and name <${name}>`,
      )
    }
  }
  const removeCurrentProvider: React.MouseEventHandler<
    HTMLSpanElement
  > = async (_: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
    if (currentProviderState) {
      await removeProvider(currentProviderState)
    }
  }
  const removeProvider = async (name: string) => {
    try {
      // Reset related states
      resetProviderInfos()

      // Remove provider then update states with updated details
      await ClientWallet.removeProvider(name)
      await getProviderList()
      await getWalletProviderDetails()
      console.debug(`Removed provider with name <${name}>`)
    } catch (err) {
      console.error(
        `Provider removal failed with error <${err})> and name <${name}>`,
      )
    }
  }

  type TrashProps = {
    onClick: React.MouseEventHandler<HTMLButtonElement>
  }

  const TrashButton = ({ onClick }: TrashProps) => (
    <button onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-4 w-4 relative top-1 transition duration-200 ease-in-out hover:fill-red-400"
        fill="currentColor"
      >
        <path d="m15.707,11.707l-2.293,2.293,2.293,2.293c.391.391.391,1.023,0,1.414-.195.195-.451.293-.707.293s-.512-.098-.707-.293l-2.293-2.293-2.293,2.293c-.195.195-.451.293-.707.293s-.512-.098-.707-.293c-.391-.391-.391-1.023,0-1.414l2.293-2.293-2.293-2.293c-.391-.391-.391-1.023,0-1.414s1.023-.391,1.414,0l2.293,2.293,2.293-2.293c.391-.391,1.023-.391,1.414,0s.391,1.023,0,1.414Zm7.293-6.707c0,.553-.448,1-1,1h-.885l-1.276,13.472c-.245,2.581-2.385,4.528-4.978,4.528h-5.727c-2.589,0-4.729-1.943-4.977-4.521l-1.296-13.479h-.86c-.552,0-1-.447-1-1s.448-1,1-1h4.101c.465-2.279,2.485-4,4.899-4h2c2.414,0,4.435,1.721,4.899,4h4.101c.552,0,1,.447,1,1Zm-14.828-1h7.656c-.413-1.164-1.524-2-2.828-2h-2c-1.304,0-2.415.836-2.828,2Zm10.934,2H4.87l1.278,13.287c.148,1.547,1.432,2.713,2.986,2.713h5.727c1.556,0,2.84-1.168,2.987-2.718l1.258-13.282Z" />
      </svg>
    </button>
  )

  //TODO: refactor this component
  return (
    <div className="card bg-base-100 h-fit w-full">
      <div className="card-body">
        {/* Spinner displayed while fetching wallet / provider infos */}
        {loading ? (
          <div className="absolute h-full w-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2 bg-slate-950/50 z-10">
            <span className="loading loading-ring loading-lg"></span>
          </div>
        ) : undefined}

        {/* Wallet section */}
        <div>
          <label className="label">
            <span className="label-text font-semibold text-lg">Wallet</span>
            {currentWalletState && currentWalletState.trim() != "" ? (
              <TrashButton onClick={removeCurrentWallet} />
            ) : undefined}
          </label>
          <div className="join w-full">
            {/* Wallet creation menu */}
            <button
              className="btn btn-active btn-primary text-lg join-item"
              onClick={() => {
                const modal = document.getElementById(
                  "WalletAddModal",
                ) as HTMLDialogElement
                if (modal) {
                  setNewWalletMnemonicState("")
                  setNewWalletNameState("")
                  setNewWalletErrorState("")
                  modal.showModal()
                }
              }}
            >
              +
            </button>
            <dialog id="WalletAddModal" className="modal">
              {loading ? (
                <div className="absolute h-full w-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2 bg-slate-950/50 z-10">
                  <span className="loading loading-ring loading-lg"></span>
                </div>
              ) : undefined}
              <div className="modal-box w-10/12">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                <h3 className="font-bold text-lg">Add a new wallet</h3>
                <form method="dialog" onSubmit={newWalletSubmit}>
                  <label className="label">
                    <span className="label-text font-semibold">Name</span>
                  </label>
                  <input
                    type="text"
                    value={newWalletNameState}
                    onChange={(event) =>
                      setNewWalletNameState(event.currentTarget.value)
                    }
                    className="input input-bordered w-full max-w-xs"
                  />
                  <label className="label">
                    <span className="label-text font-semibold">Mnemonic</span>
                  </label>
                  <input
                    type="text"
                    value={newWalletMnemonicState}
                    onChange={(event) =>
                      setNewWalletMnemonicState(event.currentTarget.value)
                    }
                    className="input input-bordered w-full max-w-xs"
                  />
                  <label className="label">
                    <span className="label-text text-red-400 font-semibold">
                      {newWalletErrorState}
                    </span>
                  </label>
                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn"
                      disabled={
                        newWalletNameState.trim().length == 0 ||
                        newWalletMnemonicState.trim().length == 0
                      }
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
            {/* Wallet dropdown selector */}
            <select
              className="select select-primary w-full max-w-xl join-item"
              value={currentWalletState}
              onInput={selectWallet}
              defaultValue="Select a wallet"
            >
              {[
                <option key={`wallet-${walletListState.length}`} disabled>
                  Select a wallet
                </option>,
              ].concat(
                walletListState.map((name, index) => (
                  <option key={`wallet-${index}`}>{name}</option>
                )),
              )}
            </select>
          </div>
          {/* Wallet infos */}
          <div className="mt-1">
            <div className="label">
              <span
                className={`label-text ${walletAddressState == "" ? "text-slate-500" : "text-white"} font-semibold`}
              >
                Address
              </span>
              <span
                className={`label-text ${walletAddressState == "" ? "text-slate-500" : "text-white"} max-w-5xl ms-10 truncate`}
              >
                {walletAddressState.trim() == "" ? "-" : walletAddressState}
              </span>
            </div>
          </div>
        </div>

        {/* Provider section */}
        <div className="mt-4">
          <label className="label">
            <span className="label-text font-semibold text-lg">Provider</span>
            {currentProviderState && currentProviderState.trim() != "" ? (
              <TrashButton onClick={removeCurrentProvider} />
            ) : undefined}
          </label>
          <div className="join w-full">
            {/* Provider creation menu */}
            <button
              className="btn btn-active btn-secondary text-lg join-item"
              onClick={() => {
                const modal = document.getElementById(
                  "ProviderAddModal",
                ) as HTMLDialogElement
                if (modal) {
                  setNewProviderNameState("")
                  setNewProviderAddressState("")
                  setNewProviderErrorState("")
                  modal.showModal()
                }
              }}
            >
              +
            </button>
            <dialog id="ProviderAddModal" className="modal">
              {loading ? (
                <div className="absolute h-full w-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2 bg-slate-950/50 z-10">
                  <span className="loading loading-ring loading-lg"></span>
                </div>
              ) : undefined}
              <div className="modal-box w-10/12">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                <h3 className="font-bold text-lg">Add a new provider</h3>
                <form method="dialog" onSubmit={newProviderSubmit}>
                  <label className="label">
                    <span className="label-text font-semibold">Name</span>
                  </label>
                  <input
                    type="text"
                    value={newProviderNameState}
                    onChange={(event) =>
                      setNewProviderNameState(event.currentTarget.value)
                    }
                    className="input input-bordered w-full max-w-xs"
                  />
                  <label className="label">
                    <span className="label-text font-semibold">Address</span>
                  </label>
                  <input
                    type="text"
                    value={newProviderAddressState}
                    onChange={(event) =>
                      setNewProviderAddressState(event.currentTarget.value)
                    }
                    className="input input-bordered w-full max-w-xs"
                  />
                  <label className="label">
                    <span className="label-text text-red-400 font-semibold">
                      {newProviderErrorState}
                    </span>
                  </label>
                  <div className="modal-action">
                    <button
                      type="submit"
                      className="btn"
                      disabled={
                        newProviderNameState.trim().length == 0 ||
                        newProviderAddressState.trim().length == 0
                      }
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </dialog>
            {/* Provider dropdown selector */}
            <select
              className="select select-secondary w-full max-w-xl join-item"
              value={currentProviderState}
              onInput={selectProvider}
              defaultValue="Select a provider"
            >
              {[
                <option key={`provider-${providerListState.length}`} disabled>
                  Select a provider
                </option>,
              ].concat(
                providerListState.map((name, index) => (
                  <option key={`provider-${index}`}>{name}</option>
                )),
              )}
            </select>
          </div>

          {/* Provider infos */}
          <div className="mt-1">
            <div className="label">
              <span
                className={`label-text ${accountNumberState == -1 ? "text-slate-500" : "text-white"} font-semibold`}
              >
                Number
              </span>
              <span
                className={`label-text ${accountNumberState == -1 ? "text-slate-500" : "text-white"} max-w-5xl ms-10 truncate`}
              >
                {accountNumberState == -1 ? "-" : accountNumberState}
              </span>
            </div>
            <div className="label">
              <span
                className={`label-text ${balanceState == -1 ? "text-slate-500" : "text-white"} font-semibold`}
              >
                Balance ($GNOT)
              </span>
              <span
                className={`label-text ${balanceState == -1 ? "text-slate-500" : "text-white"} max-w-5xl ms-10 truncate`}
              >
                {balanceState == -1 ? "-" : balanceState}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
