<script lang="ts">
  import {
    applyDarkModeFilter,
    CLASSES,
    CURSOR_TYPE,
    FRAME_STYLE,
    KEYS,
    POINTER_EVENTS,
  } from "@svelte-draw/common";

  import type { AppState } from "../types";
  import type { App } from "../types";
  import type { FrameNameRenderModel } from "./renderModel";

  type Props = {
    app: App;
    appState: AppState;
    frames: FrameNameRenderModel[];
  };

  let { app, appState, frames }: Props = $props();

  const FRAME_NAME_EDIT_PADDING = 6;

  const api = $derived(app.viewApi);

  const focusAndSelect = (input: HTMLInputElement) => {
    input.focus();
    input.select();
  };
</script>

{#each frames as frame (frame.element.id)}
  {@const f = frame.element}
  {@const x1 = frame.x1}
  <!-- the name sits on the canvas: pointer input is forwarded to the editor -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    id={frame.domId}
    class={CLASSES.FRAME_NAME}
    style:position="absolute"
    style:opacity={frame.opacity}
    style:bottom="{appState.height +
      FRAME_STYLE.nameOffsetY -
      // viewport y of the frame's top edge (names are positioned from the bottom
      // so that no text height or transform needs to be known)
      frame.y1 +
      appState.offsetTop}px"
    style:left="{x1 - appState.offsetLeft}px"
    style:z-index="2"
    style:font-size="{FRAME_STYLE.nameFontSize}px"
    style:color={frame.isDarkTheme
      ? FRAME_STYLE.nameColorDarkTheme
      : FRAME_STYLE.nameColorLightTheme}
    style:line-height={FRAME_STYLE.nameLineHeight}
    style:width="max-content"
    style:max-width={frame.uncapWidth
      ? "none"
      : `${f.width * appState.zoom.value}px`}
    style:overflow={frame.isEditing ? "visible" : "hidden"}
    style:white-space="nowrap"
    style:text-overflow="ellipsis"
    style:cursor={CURSOR_TYPE.MOVE}
    style:pointer-events={appState.viewModeEnabled
      ? POINTER_EVENTS.disabled
      : POINTER_EVENTS.enabled}
    onpointerdown={(event) => api.onCanvasPointerDown(event)}
    oncontextmenu={api.onCanvasContextMenu}
    ondblclick={() => {
      app.setState({ editingFrame: f.id });
    }}
  >
    {#if frame.isEditing}
      <input
        {@attach focusAndSelect}
        value={frame.name}
        oninput={(event) => {
          app.scene.mutateElement(f, { name: event.currentTarget.value });
        }}
        onblur={() => api.resetEditingFrame(f)}
        onkeydown={(event) => {
          // for some inexplicable reason, `onBlur` triggered on ESC
          // does not reset `state.editingFrame` despite being called,
          // and we need to reset it here as well
          if (event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) {
            api.resetEditingFrame(f);
          }
        }}
        style:background={applyDarkModeFilter(
          appState.viewBackgroundColor,
          frame.isDarkTheme,
        )}
        style:z-index="2"
        style:border="none"
        style:display="block"
        style:padding="{FRAME_NAME_EDIT_PADDING}px"
        style:border-radius="4px"
        style:box-shadow="inset 0 0 0 1px var(--color-primary)"
        style:font-family="Assistant"
        style:font-size="{FRAME_STYLE.nameFontSize}px"
        style:transform="translate(-{FRAME_NAME_EDIT_PADDING}px, {FRAME_NAME_EDIT_PADDING}px)"
        style:color={frame.isDarkTheme
          ? FRAME_STYLE.nameColorDarkTheme
          : FRAME_STYLE.nameColorLightTheme}
        style:overflow="hidden"
        style:max-width="{app.ownerDocument.body.clientWidth -
          x1 -
          FRAME_NAME_EDIT_PADDING}px"
        size={frame.name.length + 1 || 1}
        dir="auto"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
      />
    {:else}
      {frame.name}
    {/if}
  </div>
{/each}
