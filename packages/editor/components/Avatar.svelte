<script lang="ts">
  import { getNameInitial } from "../clients";

  import "./Avatar.scss";

  import type { ClassValue } from "svelte/elements";

  type Props = {
    onclick: (event: MouseEvent) => void;
    color: string;
    name: string;
    src?: string;
    class?: ClassValue;
  };

  let { color, onclick, name, src, class: className }: Props = $props();

  const shortName = $derived(getNameInitial(name));
  let error = $state(false);
  const loadImg = $derived(!error && src);
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class={["Avatar", className]}
  style={loadImg ? undefined : `background: ${color}`}
  {onclick}
>
  {#if loadImg}
    <img
      class="Avatar-img"
      {src}
      alt={shortName}
      referrerpolicy="no-referrer"
      onerror={() => (error = true)}
    />
  {:else}
    {shortName}
  {/if}
</div>
