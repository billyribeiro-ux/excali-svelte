<script lang="ts">
  import { DefaultSidebar, SvelteDraw, Footer, MainMenu } from "../index";

  import type { SvelteDrawProps } from "../types";

  let {
    excalidrawProps = {},
    variant,
  }: {
    excalidrawProps?: SvelteDrawProps;
    variant: "host-child" | "host-ui";
  } = $props();
</script>

{#if variant === "host-child"}
  <SvelteDraw {...excalidrawProps}>
    <!-- children may be functional (e.g. excalidraw.com's <Collab/>),
         so they must mount even with the default UI disabled -->
    <div data-testid="host-child"></div>
  </SvelteDraw>
{:else}
  <SvelteDraw {...excalidrawProps}>
    <MainMenu>
      <MainMenu.Item onSelect={() => {}}>host menu item</MainMenu.Item>
      <MainMenu.DefaultItems.SaveAsImage />
    </MainMenu>
    <Footer>
      <div data-testid="host-footer"></div>
    </Footer>
    <DefaultSidebar.Trigger title="host sidebar" />
  </SvelteDraw>
{/if}
