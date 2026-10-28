<script lang="ts">
  import "./Spinner.scss";

  type Props = {
    size?: string | number;
    circleWidth?: number;
    synchronized?: boolean;
    class?: string;
  };

  let {
    size = "1em",
    circleWidth = 8,
    synchronized = false,
    class: className = "",
  }: Props = $props();

  const mountDelay = -(Date.now() % 1600);
  const dimension = $derived(typeof size === "number" ? `${size}px` : size);
</script>

<div class={`Spinner ${className}`}>
  <svg
    viewBox="0 0 100 100"
    style:width={dimension}
    style:height={dimension}
    style:--spinner-delay={synchronized ? `${mountDelay}ms` : 0}
  >
    <circle
      cx="50"
      cy="50"
      r={50 - circleWidth / 2}
      stroke-width={circleWidth}
      fill="none"
      stroke-miterlimit="10"
    />
  </svg>
</div>
