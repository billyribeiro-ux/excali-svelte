<script lang="ts">
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    heading: "canvasActions" | "selectedShapeActions" | "shapes";
    /** rendered after the (visually hidden) heading */
    children?: Snippet;
    /**
     * render-prop variant (the React `children` function): receives the heading
     * snippet and is responsible for rendering it; replaces `children`
     */
    content?: Snippet<[heading: Snippet]>;
    class?: ClassValue;
  };

  let { heading, children, content, class: className }: Props = $props();

  const ctx = getEditorContext();
  const titleId = $derived(`${ctx.app.id}-${heading}-title`);
</script>

{#snippet header()}
  <h2 class="visually-hidden" id={titleId}>
    {t(`headings.${heading}`)}
  </h2>
{/snippet}

<section class={className} aria-labelledby={titleId}>
  {#if content}
    {@render content(header)}
  {:else}
    {@render header()}
    {@render children?.()}
  {/if}
</section>
