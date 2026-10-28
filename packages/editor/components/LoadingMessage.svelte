<script lang="ts">
  import { THEME } from "@svelte-draw/common";

  import { t } from "../i18n";

  import Spinner from "./Spinner.svelte";

  import type { Theme } from "@svelte-draw/element/types";

  let { delay, theme }: { delay?: number; theme?: Theme } = $props();

  // initial value only, like the React original
  // svelte-ignore state_referenced_locally
  let isWaiting = $state(!!delay);

  $effect(() => {
    if (!delay) {
      return;
    }
    const timer = setTimeout(() => {
      isWaiting = false;
    }, delay);
    return () => clearTimeout(timer);
  });
</script>

{#if !isWaiting}
  <div class={["LoadingMessage", { "LoadingMessage--dark": theme === THEME.DARK }]}>
    <div>
      <Spinner />
    </div>
    <div class="LoadingMessage-text">{t("labels.loadingScene")}</div>
  </div>
{/if}
