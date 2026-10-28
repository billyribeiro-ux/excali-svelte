<script lang="ts">
  import { getShortcutFromShortcutName } from "../actions/shortcuts";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import { CONTEXT_MENU_SEPARATOR } from "./ContextMenu";
  import Popover from "./Popover.svelte";

  import "./ContextMenu.scss";

  import type { ActionManager } from "../actions/manager";
  import type { ShortcutName } from "../actions/shortcuts";
  import type { TranslationKeys } from "../i18n";
  import type { ContextMenuItem, ContextMenuItems } from "./ContextMenu";

  type Props = {
    actionManager: ActionManager;
    items: ContextMenuItems;
    top: number;
    left: number;
    onClose: (callback?: () => void) => void;
  };

  let { actionManager, items, top, left, onClose }: Props = $props();

  const ctx = getEditorContext();

  const filteredItems = $derived(
    items.reduce((acc: ContextMenuItem[], item) => {
      if (
        item &&
        (item === CONTEXT_MENU_SEPARATOR ||
          !item.predicate ||
          item.predicate(
            ctx.elements,
            ctx.appState,
            actionManager.app.props,
            actionManager.app,
          ))
      ) {
        acc.push(item);
      }
      return acc;
    }, []),
  );

  const getLabel = (item: Exclude<ContextMenuItem, "separator">) => {
    if (!item.label) {
      return "";
    }
    if (typeof item.label === "function") {
      return t(
        item.label(
          ctx.elements,
          ctx.appState,
          actionManager.app,
        ) as unknown as TranslationKeys,
      );
    }
    return t(item.label as unknown as TranslationKeys);
  };
</script>

<Popover
  onCloseRequest={() => {
    onClose();
  }}
  {top}
  {left}
  fitInViewport={true}
  viewportWidth={ctx.appState.width}
  viewportHeight={ctx.appState.height}
  class="context-menu-popover"
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <ul class="context-menu" oncontextmenu={(event) => event.preventDefault()}>
    {#each filteredItems as item, idx (idx)}
      {#if item === CONTEXT_MENU_SEPARATOR}
        {#if filteredItems[idx - 1] && filteredItems[idx - 1] !== CONTEXT_MENU_SEPARATOR}
          <hr class="context-menu-item-separator" />
        {/if}
      {:else}
        {@const actionName = item.name}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <li
          data-testid={actionName}
          onclick={() => {
            // we need update state before executing the action in case
            // the action uses the appState it's being passed (that still
            // contains a defined contextMenu) to return the next state.
            onClose(() => {
              actionManager.executeAction(item, "contextMenu");
            });
          }}
        >
          <button
            type="button"
            class={[
              "context-menu-item",
              {
                dangerous: actionName === "deleteSelectedElements",
                checkmark: item.checked?.(ctx.appState),
              },
            ]}
          >
            <div class="context-menu-item__label">{getLabel(item)}</div>
            <kbd class="context-menu-item__shortcut">
              {actionName
                ? getShortcutFromShortcutName(actionName as ShortcutName)
                : ""}
            </kbd>
          </button>
        </li>
      {/if}
    {/each}
  </ul>
</Popover>
