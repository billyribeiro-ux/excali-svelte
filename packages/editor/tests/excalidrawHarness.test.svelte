<script lang="ts">
  import { SvelteDraw, Footer, MainMenu } from "../index";

  import type { SvelteDrawProps } from "../types";

  type Variant =
    | "plain-child"
    | "footer"
    | "background-picker-menu"
    | "custom-and-load-menu"
    | "host-menu-items"
    | "theme-toggle-menu";

  let {
    variant,
    excalidrawProps = {},
  }: {
    variant: Variant;
    excalidrawProps?: SvelteDrawProps;
  } = $props();
</script>

<SvelteDraw {...excalidrawProps}>
  {#if variant === "plain-child"}
    <div>This is a custom footer</div>
  {:else if variant === "footer"}
    <Footer>
      <div>This is a custom footer</div>
    </Footer>
  {:else if variant === "background-picker-menu"}
    <MainMenu>
      <MainMenu.DefaultItems.ChangeCanvasBackground />
    </MainMenu>
  {:else if variant === "custom-and-load-menu"}
    <MainMenu>
      <MainMenu.ItemCustom>
        <button
          style="height: 2rem"
          onclick={() => window.alert("custom menu item")}
        >
          custom item
        </button>
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.LoadScene />
    </MainMenu>
  {:else if variant === "host-menu-items"}
    <MainMenu>
      <MainMenu.Item onSelect={() => window.alert("Clicked")}>
        Click me
      </MainMenu.Item>
      <MainMenu.ItemLink href="blog.excalidaw.com">
        Excalidraw blog
      </MainMenu.ItemLink>
      <MainMenu.ItemCustom>
        <button
          style="height: 2rem"
          onclick={() => window.alert("custom menu item")}
        >
          custom menu item
        </button>
      </MainMenu.ItemCustom>
      <MainMenu.DefaultItems.Help />
    </MainMenu>
  {:else if variant === "theme-toggle-menu"}
    <MainMenu>
      <MainMenu.DefaultItems.ToggleTheme allowSystemTheme={false} />
    </MainMenu>
  {/if}
</SvelteDraw>
