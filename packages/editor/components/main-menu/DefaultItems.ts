import Preferences from "./DefaultItems/Preferences.svelte";
import BoxSelectionMode from "./DefaultItems/Preferences/BoxSelectionMode.svelte";
import InputDevice from "./DefaultItems/Preferences/InputDevice.svelte";
import ToggleArrowBinding from "./DefaultItems/Preferences/ToggleArrowBinding.svelte";
import ToggleElementProperties from "./DefaultItems/Preferences/ToggleElementProperties.svelte";
import ToggleGridMode from "./DefaultItems/Preferences/ToggleGridMode.svelte";
import ToggleMidpointSnapping from "./DefaultItems/Preferences/ToggleMidpointSnapping.svelte";
import ToggleShowHints from "./DefaultItems/Preferences/ToggleShowHints.svelte";
import ToggleSnapMode from "./DefaultItems/Preferences/ToggleSnapMode.svelte";
import ToggleToolLock from "./DefaultItems/Preferences/ToggleToolLock.svelte";
import ToggleViewMode from "./DefaultItems/Preferences/ToggleViewMode.svelte";
import ToggleZenMode from "./DefaultItems/Preferences/ToggleZenMode.svelte";

import "./DefaultItems.scss";

export { default as LoadScene } from "./DefaultItems/LoadScene.svelte";
export { default as SaveToActiveFile } from "./DefaultItems/SaveToActiveFile.svelte";
export { default as SaveAsImage } from "./DefaultItems/SaveAsImage.svelte";
export { default as CommandPalette } from "./DefaultItems/CommandPalette.svelte";
export { default as SearchMenu } from "./DefaultItems/SearchMenu.svelte";
export { default as Help } from "./DefaultItems/Help.svelte";
export { default as ClearCanvas } from "./DefaultItems/ClearCanvas.svelte";
export { default as ToggleTheme } from "./DefaultItems/ToggleTheme.svelte";
export { default as ChangeCanvasBackground } from "./DefaultItems/ChangeCanvasBackground.svelte";
export { default as Export } from "./DefaultItems/Export.svelte";
export { default as Socials } from "./DefaultItems/Socials.svelte";
export { default as LiveCollaborationTrigger } from "./DefaultItems/LiveCollaborationTrigger.svelte";

export {
  ToggleGridMode as PreferencesToggleGridModeItem,
  ToggleZenMode as PreferencesToggleZenModeItem,
};

/** `<Preferences>` submenu with the individual preference items as parts */
const PreferencesWithItems = Object.assign(Preferences, {
  ToggleToolLock,
  BoxSelectionMode,
  InputDevice,
  ToggleSnapMode,
  ToggleArrowBinding,
  ToggleMidpointSnapping,
  ToggleShowHints,
  ToggleGridMode,
  ToggleZenMode,
  ToggleViewMode,
  ToggleElementProperties,
});

export { PreferencesWithItems as Preferences };
