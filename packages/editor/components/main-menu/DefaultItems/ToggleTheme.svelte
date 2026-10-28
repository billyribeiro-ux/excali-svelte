<script lang="ts">
  import { THEME } from "@svelte-draw/common";

  import { actionToggleTheme } from "../../../actions";
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import DropdownMenuItemContentRadio from "../../dropdownMenu/DropdownMenuItemContentRadio.svelte";
  import { DeviceDesktopIcon, MoonIcon, SunIcon } from "../../icons";

  import type { Theme } from "@svelte-draw/element/types";

  type Props =
    | {
        allowSystemTheme: true;
        /**
         * Controls the theme of this UI component only.
         * You should subscribe to `props.onThemeChange` and control the theme
         * upstream.
         */
        theme: Theme | "system";
      }
    | {
        allowSystemTheme: false;
      };

  let props: Props = $props();

  const ctx = getEditorContext();
  const shortcut = getShortcutFromShortcutName("toggleTheme");
  const isDark = $derived(ctx.appState.theme === THEME.DARK);
</script>

{#if ctx.actionManager.isActionEnabled(actionToggleTheme)}
  {#if props.allowSystemTheme}
    <DropdownMenuItemContentRadio
      name="theme"
      value={props.theme}
      onChange={(value: Theme | "system") => {
        if (ctx.props.onThemeChange) {
          ctx.props.onThemeChange(value);
          return;
        }

        console.warn(
          "MainMenu.DefaultItems.ToggleTheme: `<SvelteDraw /> props.onThemeChange` must be defined to use system theme selection.",
        );
      }}
      choices={[
        {
          value: THEME.LIGHT,
          label: SunIcon,
          ariaLabel: `${t("buttons.lightMode")} - ${shortcut}`,
        },
        {
          value: THEME.DARK,
          label: MoonIcon,
          ariaLabel: `${t("buttons.darkMode")} - ${shortcut}`,
        },
        {
          value: "system",
          label: DeviceDesktopIcon,
          ariaLabel: t("buttons.systemMode"),
        },
      ]}
    >
      {t("labels.theme")}
    </DropdownMenuItemContentRadio>
  {:else}
    <DropdownMenuItem
      onSelect={(event) => {
        // do not close the menu when changing theme
        event.preventDefault();

        ctx.actionManager.executeAction(actionToggleTheme);
      }}
      icon={isDark ? SunIcon : MoonIcon}
      data-testid="toggle-dark-mode"
      {shortcut}
      aria-label={isDark ? t("buttons.lightMode") : t("buttons.darkMode")}
    >
      {isDark ? t("buttons.lightMode") : t("buttons.darkMode")}
    </DropdownMenuItem>
  {/if}
{/if}
