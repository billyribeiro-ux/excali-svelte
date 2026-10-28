<script lang="ts">
  import Trans from "./Trans.svelte";

  import type { TranslationKeys } from "../i18n";

  const key = (name: string) => `transTest.${name}` as unknown as TranslationKeys;
</script>

{#snippet link(el: import("svelte").Snippet)}
  <a href="https://example.com">{@render el()}</a>
{/snippet}

{#snippet bold(el: import("svelte").Snippet)}
  <strong>{@render el()}</strong>
{/snippet}

<div data-testid="test1">
  <Trans i18nKey={key("key1")} audience="world" />
</div>
<div data-testid="test2">
  <Trans i18nKey={key("key2")} {link} />
</div>
<div data-testid="test3">
  <Trans i18nKey={key("key3")} {link} location="the button" />
</div>
<div data-testid="test4">
  <Trans i18nKey={key("key4")} {link} location="the button" {bold} />
</div>
<div data-testid="test5">
  <Trans i18nKey={key("key5")} connect-link={link} />
</div>
