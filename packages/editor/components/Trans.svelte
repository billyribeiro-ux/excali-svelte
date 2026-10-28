<!--
Trans component is used for translating markup.

```json
{
  "example1": "Hello {{audience}}",
  "example2": "Please <link>click the button</link> to continue.",
  "example3": "Please <link>click {{location}}</link> to continue.",
  "example4": "Please <link>click <bold>{{location}}</bold></link> to continue.",
}
```

`{{name}}` placeholders are passed as string/number props, `<name>…</name>`
groups as snippet props that receive the group's content as their argument:

```svelte
<Trans i18nKey="example1" audience="world" />

{#snippet link(el)}<a href="https://example.com">{@render el()}</a>{/snippet}
{#snippet bold(el)}<strong>{@render el()}</strong>{/snippet}

<Trans i18nKey="example2" {link} />
<Trans i18nKey="example3" {link} location="the button" />
<Trans i18nKey="example4" {link} {bold} location="the button" />
```

Output:

```html
Hello world
Please <a href="https://example.com">click the button</a> to continue.
Please <a href="https://example.com">click the button</a> to continue.
Please <a href="https://example.com">click <strong>the button</strong></a> to continue.
```
-->
<script lang="ts">
  import { useI18n } from "../i18n";

  import { parseTransFormat } from "./Trans";

  import type { Snippet } from "svelte";
  import type { TranslationKeys } from "../i18n";
  import type { TransNode } from "./Trans";

  type Props = {
    i18nKey: TranslationKeys;
    [key: string]: string | number | Snippet | Snippet<[Snippet]> | undefined;
  };

  let { i18nKey, ...props }: Props = $props();

  const { t } = useI18n();

  const nodes = $derived(
    parseTransFormat(t(i18nKey), (name) =>
      Object.prototype.hasOwnProperty.call(props, name),
    ),
  );
</script>

{#snippet renderNodes(list: TransNode[])}
  {#each list as node, index (index)}
    {#if node.type === "text"}
      {node.text}
    {:else if node.type === "key"}
      {@const value = props[node.name]}
      {#if typeof value === "function"}
        {@render (value as Snippet)()}
      {:else}
        {value}
      {/if}
    {:else}
      {@const wrap = props[node.name]}
      {#if typeof wrap === "function"}
        {#snippet inner()}
          {@render renderNodes(node.children)}
        {/snippet}
        {@render (wrap as Snippet<[Snippet]>)(inner)}
      {/if}
    {/if}
  {/each}
{/snippet}

{@render renderNodes(nodes)}
