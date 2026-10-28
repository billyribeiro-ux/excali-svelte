<script lang="ts">
  import TopErrorBoundary from "#lib/app/components/TopErrorBoundary.svelte";

  import ThrowingChild from "./ThrowingChild.test.svelte";
</script>

<TopErrorBoundary>
  <ThrowingChild />
</TopErrorBoundary>
