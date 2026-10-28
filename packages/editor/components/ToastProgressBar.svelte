<script lang="ts">
  import "./Toast.scss";

  let { progress }: { progress: number } = $props();
</script>

<div class="Toast__progress-bar">
  <div
    class="Toast__progress-bar-fill"
    style:width={`${Math.min(5, Math.round(progress * 100))}%`}
  ></div>
</div>
