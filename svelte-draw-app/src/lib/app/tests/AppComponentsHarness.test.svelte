<script lang="ts">
  import { SvelteDraw } from "@svelte-draw/editor";

  import AppFooter from "#lib/app/components/AppFooter.svelte";
  import AppMainMenu from "#lib/app/components/AppMainMenu.svelte";
  import AppWelcomeScreen from "#lib/app/components/AppWelcomeScreen.svelte";

  let {
    onCollabDialogOpen,
  }: {
    onCollabDialogOpen: () => void;
  } = $props();
</script>

<SvelteDraw>
  <AppMainMenu
    {onCollabDialogOpen}
    isCollaborating={false}
    isCollabEnabled={true}
    theme="light"
    refresh={() => {}}
  />
  <AppWelcomeScreen {onCollabDialogOpen} isCollabEnabled={true} />
  <AppFooter onChange={() => {}} />
</SvelteDraw>
