<script lang="ts">
  import { WelcomeScreen } from "@svelte-draw/editor";
  import { t } from "@svelte-draw/editor/i18n";

  type Props = {
    onCollabDialogOpen: () => any;
    isCollabEnabled: boolean;
  };

  let { onCollabDialogOpen, isCollabEnabled }: Props = $props();
</script>

<WelcomeScreen>
  <WelcomeScreen.Hints.MenuHint>
    {t("welcomeScreen.app.menuHint")}
  </WelcomeScreen.Hints.MenuHint>
  <WelcomeScreen.Hints.ToolbarHint />
  <WelcomeScreen.Hints.HelpHint />
  <WelcomeScreen.Center>
    <WelcomeScreen.Center.Logo />
    <WelcomeScreen.Center.Heading>
      {t("welcomeScreen.app.center_heading")}
      <br />
      {t("welcomeScreen.app.center_heading_line2")}
      <br />
      {t("welcomeScreen.app.center_heading_line3")}
    </WelcomeScreen.Center.Heading>
    <WelcomeScreen.Center.Menu>
      <WelcomeScreen.Center.MenuItemLoadScene />
      <WelcomeScreen.Center.MenuItemHelp />
      {#if isCollabEnabled}
        <WelcomeScreen.Center.MenuItemLiveCollaborationTrigger
          onSelect={() => onCollabDialogOpen()}
        />
      {/if}
    </WelcomeScreen.Center.Menu>
  </WelcomeScreen.Center>
</WelcomeScreen>
