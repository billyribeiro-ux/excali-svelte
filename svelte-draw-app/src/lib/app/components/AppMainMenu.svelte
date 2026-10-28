<script lang="ts">
  import { MainMenu } from "@svelte-draw/editor";
  import { eyeIcon } from "@svelte-draw/editor/components/icons";
  import { isDevEnv } from "@svelte-draw/common";

  import LanguageList from "#lib/app/app-language/LanguageList.svelte";

  import { saveDebugState } from "./DebugCanvas.ts";
  import { bumpVisualDebugRevision } from "./visualDebugRevision.svelte.ts";

  import type { Theme } from "@svelte-draw/element/types";

  type Props = {
    onCollabDialogOpen: () => any;
    isCollaborating: boolean;
    isCollabEnabled: boolean;
    theme: Theme | "system";
    refresh: () => void;
  };

  let {
    onCollabDialogOpen,
    isCollaborating,
    isCollabEnabled,
    theme,
    refresh,
  }: Props = $props();
</script>

<MainMenu>
  <MainMenu.DefaultItems.LoadScene />
  <MainMenu.DefaultItems.SaveToActiveFile />
  <MainMenu.DefaultItems.Export />
  <MainMenu.DefaultItems.SaveAsImage />
  {#if isCollabEnabled}
    <MainMenu.DefaultItems.LiveCollaborationTrigger
      {isCollaborating}
      onSelect={() => onCollabDialogOpen()}
    />
  {/if}
  <MainMenu.DefaultItems.CommandPalette class="highlighted" />
  <MainMenu.DefaultItems.SearchMenu />
  <MainMenu.DefaultItems.Help />
  <MainMenu.DefaultItems.ClearCanvas />
  <MainMenu.Separator />
  <MainMenu.DefaultItems.Socials />
  {#if isDevEnv()}
    <MainMenu.Item
      icon={eyeIcon}
      onSelect={() => {
        if (window.visualDebug) {
          delete window.visualDebug;
          saveDebugState({ enabled: false });
        } else {
          window.visualDebug = { data: [] };
          saveDebugState({ enabled: true });
        }
        bumpVisualDebugRevision();
        refresh();
      }}
    >
      Visual Debug
    </MainMenu.Item>
  {/if}
  <MainMenu.Separator />
  <MainMenu.DefaultItems.Preferences />
  <MainMenu.DefaultItems.ToggleTheme allowSystemTheme {theme} />
  <MainMenu.ItemCustom>
    <LanguageList style="width: 100%;" />
  </MainMenu.ItemCustom>
  <MainMenu.DefaultItems.ChangeCanvasBackground />
</MainMenu>
