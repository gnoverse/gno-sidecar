import { useState, useEffect } from "react"
import { ClientSettings } from "../../background/client/client"
import type {
  SettingDetails,
  SettingToggle,
  SettingText,
  SettingSelect,
  SettingState,
} from "../../background/types/api"

type SettingInputProps = {
  setting: SettingDetails
}

function SettingInput({ setting: { infos, state } }: SettingInputProps) {
  // If this input is a select
  const select = state.state as SettingSelect
  if (select.choices != undefined) {
    // State management for select input
    const [selected, setSelected] = useState<string>(select.selected)

    const selectChoice: React.FormEventHandler<HTMLSelectElement> = async (
      choice: React.FormEvent<HTMLSelectElement>,
    ) => {
      const update = choice.currentTarget.value
      const newState: SettingState = {
        disabled: state.disabled,
        state: {
          choices: select.choices,
          selected: update,
        },
      }

      try {
        await ClientSettings.setSettingState({
          name: infos.name,
          state: newState,
        })
        setSelected(update)
      } catch (err) {
        console.error(
          `Choice selection failed with name <${infos.name}> and error : ${err})`,
        )
      }
    }

    return (
      <select
        className="select"
        value={selected}
        onInput={selectChoice}
        disabled={state.disabled || undefined}
      >
        {select.choices.map((name, index) => (
          <option key={`${name}-${index}`}>{name}</option>
        ))}
      </select>
    )
  }

  // If this input is a toggle
  const toggle = state.state as SettingToggle
  if (toggle.toggle != undefined) {
    // State management for toggle input
    const [enabled, setEnabled] = useState<boolean>(toggle.toggle)

    const switchToggle = async () => {
      const update = !enabled
      const newState: SettingState = {
        disabled: state.disabled,
        state: { toggle: update },
      }

      try {
        await ClientSettings.setSettingState({
          name: infos.name,
          state: newState,
        })
        setEnabled(update)
      } catch (err) {
        console.error(
          `Toggle setting failed with name <${infos.name}> and error : ${err})`,
        )
      }
    }

    return (
      <input
        className="toggle"
        type="checkbox"
        checked={enabled}
        onChange={switchToggle}
        disabled={state.disabled || undefined}
      />
    )
  }

  const input = state.state as SettingText
  if (input.text != undefined) {
    // State management for text input
    const [text, setText] = useState<string>(input.text)

    const setContent: React.FormEventHandler<HTMLInputElement> = async (
      choice: React.FormEvent<HTMLInputElement>,
    ) => {
      const update = choice.currentTarget.value
      const newState: SettingState = {
        disabled: state.disabled,
        state: { text: update },
      }

      try {
        await ClientSettings.setSettingState({
          name: infos.name,
          state: newState,
        })
        setText(update)
      } catch (err) {
        console.error(
          `Content setting failed with name <${infos.name}> and error : ${err})`,
        )
      }
    }

    // If this input is a text
    return (
      <input
        type="text"
        placeholder="Type here"
        className="input input-bordered"
        value={text}
        onInput={setContent}
        disabled={state.disabled || undefined}
      />
    )
  }
}

export default function SettingsScreen() {
  type CategoryDetails = {
    category: string
    settings: SettingDetails[]
  }

  // States containing all settings entries
  const [settingCategoriesState, setSettingCategoriesState] = useState<
    CategoryDetails[]
  >([])

  // Fetch initial component states from background / storage
  useEffect(() => {
    ;(async () => {
      try {
        const settings = await ClientSettings.getSettingList()
        const categories: CategoryDetails[] = []
        const categoryMap: Map<string, SettingDetails[]> = new Map()

        // Sort settings by category using a Map
        for (const setting of settings) {
          const category: SettingDetails[] =
            categoryMap.get(setting.infos.category) || []

          category.push(setting)
          categoryMap.set(setting.infos.category, category)
        }

        // Convert Map to array (easier to handle in React component)
        for (const [category, settings] of categoryMap) {
          categories.push({ category, settings })
        }
        setSettingCategoriesState(categories)
      } catch (err) {
        console.error("Unable to fetch initial states :", err)
      }
    })()
  }, [])

  type SettingProps = {
    setting: SettingDetails
  }

  const Setting = ({ setting }: SettingProps) => (
    <label className="label cursor-pointer">
      <span
        className="label-text tooltip tooltip-bottom before:max-w-[300px] before:absolute before:left-[140px] mr-3"
        data-tip={setting.infos.help}
      >
        {setting.infos.name}
      </span>
      <SettingInput setting={setting} />
    </label>
  )

  type CategoryProps = {
    index: number // Used to generate unique key for setting component
    category: CategoryDetails
  }

  const Category = ({ index, category }: CategoryProps) => (
    <div>
      <label className="label">
        <span className="label-text font-semibold text-lg">
          {category.category}
        </span>
      </label>
      {category.settings.map((setting, subindex) => (
        <Setting setting={setting} key={`setting-${index}-${subindex}`} />
      ))}
    </div>
  )

  return (
    <div className="card bg-base-100 w-full min-h-80 max-h-[600px]">
      <div className="card-body">
        {settingCategoriesState.length > 0 ? (
          settingCategoriesState.map((category, index) => (
            <Category
              category={category}
              index={index}
              key={`category-${index}`}
            />
          ))
        ) : (
          <div className="flex items-center justify-center text-center h-fit min-h-64">
            <p className="text-xl">❌ No settings found</p>
          </div>
        )}
      </div>
    </div>
  )
}
