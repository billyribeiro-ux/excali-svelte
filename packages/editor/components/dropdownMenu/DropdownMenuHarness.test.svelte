<script lang="ts">
  import { setEditorContext } from "../../ui/editorContext";
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { checkIcon } from "../icons";

  import DropdownMenu from "./DropdownMenu";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    onItemSelect,
    onKeepOpenSelect,
    onContentSelect,
  }: {
    ctx: EditorContextValue;
    onItemSelect?: (event: Event) => void;
    onKeepOpenSelect?: () => void;
    onContentSelect?: () => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
  setTunnels(createTunnels());

  // same pattern as `ExtraToolsDropdown`: the host owns the open state
  let open = $state(false);
</script>

<div class="excalidraw-container">
  <div class="App-toolbar">
    <DropdownMenu {open}>
      <DropdownMenu.Trigger
        onToggle={() => (open = !open)}
        class="App-toolbar__extra-tools-trigger"
        title="More tools"
      >
        more
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        onClickOutside={() => (open = false)}
        onSelect={() => {
          onContentSelect?.();
          open = false;
        }}
        class="test-menu"
      >
        <DropdownMenu.Item
          onSelect={onItemSelect}
          icon={checkIcon}
          shortcut="Q"
          data-testid="plain-item"
        >
          Plain
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={(event) => {
            event.preventDefault();
            onKeepOpenSelect?.();
          }}
          data-testid="keep-open-item"
          aria-label="Keep open"
          selected
        >
          Keep open
        </DropdownMenu.Item>
        <DropdownMenu.ItemCheckbox checked={true} data-testid="checked-item">
          Checked
        </DropdownMenu.ItemCheckbox>
        <DropdownMenu.ItemCheckbox checked={false} data-testid="unchecked-item">
          Unchecked
        </DropdownMenu.ItemCheckbox>
        <DropdownMenu.ItemLink
          href="https://example.com"
          data-testid="link-item"
          rel="external"
        >
          Link
        </DropdownMenu.ItemLink>
        <DropdownMenu.Separator />
        <DropdownMenu.Group title="Group title">
          <DropdownMenu.ItemCustom data-testid="custom-item">
            custom
          </DropdownMenu.ItemCustom>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu>
  </div>
  <canvas></canvas>
  <button type="button" data-testid="toolbar-rectangle">rect</button>
</div>
