<script lang="ts">
  import Trans from "@svelte-draw/editor/components/Trans.svelte";
</script>

{#snippet bold(content: import("svelte").Snippet)}
  <strong>{@render content()}</strong>
{/snippet}

{#snippet br()}
  <br />
{/snippet}

<Trans i18nKey="overwriteConfirm.modal.shareableLink.description" {bold} {br} />
