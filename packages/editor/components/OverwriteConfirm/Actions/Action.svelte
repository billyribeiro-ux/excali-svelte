<script lang="ts" module>
  import type { Snippet } from "svelte";

  export type ActionProps = {
    title: string;
    children: Snippet;
    actionLabel: string;
    onClick: () => void;
  };
</script>

<script lang="ts">
  import FilledButton from "../../FilledButton.svelte";

  let { title, children, actionLabel, onClick }: ActionProps = $props();
</script>

<div class="OverwriteConfirm__Actions__Action">
  <h4>{title}</h4>
  <div class="OverwriteConfirm__Actions__Action__content">
    {@render children()}
  </div>
  <FilledButton
    variant="outlined"
    color="muted"
    label={actionLabel}
    size="large"
    fullWidth
    onclick={() => onClick()}
  />
</div>
