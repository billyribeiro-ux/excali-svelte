<script lang="ts">
  import "./LibraryUnit.scss";

  let { showName }: { showName?: boolean } = $props();
</script>

<div
  class={["library-unit library-unit--skeleton", { "library-unit--named": showName }]}
></div>
