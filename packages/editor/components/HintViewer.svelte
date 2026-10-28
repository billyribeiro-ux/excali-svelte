<script lang="ts">
  import { getHintParts, getHints } from "./HintViewer";

  import type { EditorInterface } from "@svelte-draw/common";

  import type { AppClassProperties, UIAppState } from "../types";

  import "./HintViewer.scss";

  type Props = {
    appState: UIAppState;
    isMobile: boolean;
    editorInterface: EditorInterface;
    app: AppClassProperties;
  };

  let { appState, isMobile, editorInterface, app }: Props = $props();

  // replaces `app.modifiers.useHeld("alt")`
  let altHeld = $state(false);

  $effect(() => {
    const modifiers = app.modifiers;
    const update = () => {
      altHeld = modifiers.get().alt;
    };
    // catches a change between the render and subscribing
    update();
    return modifiers.onChange.on(update);
  });

  const hints = $derived(
    appState.showHints
      ? getHints({ appState, isMobile, editorInterface, app, altHeld })
      : null,
  );

  const parts = $derived(hints ? getHintParts(hints) : null);
</script>

{#if parts}
  <div class="HintViewer">
    <span
      >{#each parts as part, index (index)}{#if part.kbd}<kbd>{part.text}</kbd
          >{:else}{part.text}{/if}{/each}</span
    >
  </div>
{/if}
