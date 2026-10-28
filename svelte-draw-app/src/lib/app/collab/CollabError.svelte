<script lang="ts">
  import Icon from "@svelte-draw/editor/components/Icon.svelte";
  import { warning } from "@svelte-draw/editor/components/icons";
  import Tooltip from "@svelte-draw/editor/components/Tooltip.svelte";

  import { appAtomStore, collabErrorIndicatorAtom } from "../app-atoms.ts";

  import type { CollabErrorIndicator } from "../app-atoms.ts";

  import "./CollabError.scss";

  type Props = {
    /**
     * Optional override. By default the indicator follows
     * `collabErrorIndicatorAtom` (written by `Collab`).
     */
    collabError?: CollabErrorIndicator;
  };

  let { collabError }: Props = $props();

  const indicator = $derived(
    collabError ?? appAtomStore.get(collabErrorIndicatorAtom),
  );

  let isAnimating = $state(false);

  // re-run the shake animation every time the message or nonce changes
  $effect(() => {
    void indicator.message;
    void indicator.nonce;

    isAnimating = true;
    const timeoutId = window.setTimeout(() => {
      isAnimating = false;
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  });
</script>

{#if indicator.message}
  <Tooltip label={indicator.message} long={true}>
    <div
      class={[
        "collab-errors-button",
        isAnimating && "collab-errors-button-shake",
      ]}
    >
      <Icon icon={warning} />
    </div>
  </Tooltip>
{/if}
