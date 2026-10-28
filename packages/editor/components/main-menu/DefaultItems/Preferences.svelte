<script lang="ts">
  import { t } from "../../../i18n";
  import DropdownMenuSub from "../../dropdownMenu/DropdownMenuSub";
  import { settingsIcon } from "../../icons";

  import BoxSelectionMode from "./Preferences/BoxSelectionMode.svelte";
  import InputDevice from "./Preferences/InputDevice.svelte";
  import ToggleArrowBinding from "./Preferences/ToggleArrowBinding.svelte";
  import ToggleElementProperties from "./Preferences/ToggleElementProperties.svelte";
  import ToggleGridMode from "./Preferences/ToggleGridMode.svelte";
  import ToggleMidpointSnapping from "./Preferences/ToggleMidpointSnapping.svelte";
  import ToggleShowHints from "./Preferences/ToggleShowHints.svelte";
  import ToggleSnapMode from "./Preferences/ToggleSnapMode.svelte";
  import ToggleToolLock from "./Preferences/ToggleToolLock.svelte";
  import ToggleViewMode from "./Preferences/ToggleViewMode.svelte";
  import ToggleZenMode from "./Preferences/ToggleZenMode.svelte";

  import type { Snippet } from "svelte";

  let {
    children,
    additionalItems,
  }: {
    /** replaces the default preference items */
    children?: Snippet;
    additionalItems?: Snippet;
  } = $props();
</script>

<DropdownMenuSub>
  <DropdownMenuSub.Trigger icon={settingsIcon}>
    {t("labels.preferences")}
  </DropdownMenuSub.Trigger>
  <DropdownMenuSub.Content class="excalidraw-main-menu-preferences-submenu">
    {#if children}
      {@render children()}
    {:else}
      <BoxSelectionMode />
      <InputDevice />
      <ToggleToolLock />
      <ToggleSnapMode />
      <ToggleGridMode />
      <ToggleZenMode />
      <ToggleViewMode />
      <ToggleElementProperties />
      <ToggleArrowBinding />
      <ToggleMidpointSnapping />
      <ToggleShowHints />
    {/if}
    {@render additionalItems?.()}
  </DropdownMenuSub.Content>
</DropdownMenuSub>
