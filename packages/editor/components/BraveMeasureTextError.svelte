<script lang="ts">
  import {
    BRAVE_FINGERPRINTING_FAQ_URL,
    REPOSITORY_NEW_ISSUE_URL,
  } from "@svelte-draw/common";

  import Trans from "./Trans.svelte";
</script>

{#snippet bold(el: import("svelte").Snippet)}
  <span style="font-weight: 600;">{@render el()}</span>
{/snippet}

{#snippet link(el: import("svelte").Snippet)}
  <a href={BRAVE_FINGERPRINTING_FAQ_URL}>
    {@render el()}
  </a>
{/snippet}

{#snippet issueLink(el: import("svelte").Snippet)}
  <a href={REPOSITORY_NEW_ISSUE_URL}>
    {@render el()}
  </a>
{/snippet}

<!-- Translated copies of `line4` still mention a chat community; it has no
     link, so render its label as plain text. -->
{#snippet discordLink(el: import("svelte").Snippet)}
  <span>{@render el()}.</span>
{/snippet}

<div data-testid="brave-measure-text-error">
  <p>
    <Trans i18nKey="errors.brave_measure_text_error.line1" {bold} />
  </p>
  <p>
    <Trans i18nKey="errors.brave_measure_text_error.line2" {bold} />
  </p>
  <p>
    <Trans i18nKey="errors.brave_measure_text_error.line3" {link} />
  </p>
  <p>
    <Trans
      i18nKey="errors.brave_measure_text_error.line4"
      {issueLink}
      {discordLink}
    />
  </p>
</div>
