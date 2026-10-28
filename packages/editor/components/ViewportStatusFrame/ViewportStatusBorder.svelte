<script lang="ts">
  import "./ViewportStatusFrame.scss";

  let { border, style }: { border: string; style?: string } = $props();
</script>

<div
  class="viewport-status-frame__border"
  style="border-color: {border};{style ? ` ${style}` : ''}"
></div>
