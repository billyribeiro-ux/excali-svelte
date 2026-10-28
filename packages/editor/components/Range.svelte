<script lang="ts">
  import "./Range.scss";

  import type { RangeProps } from "./Range";

  let {
    label,
    value,
    onChange,
    min = 0,
    max = 100,
    step = 10,
    minLabel = min,
    hasCommonValue = true,
    testId,
  }: RangeProps = $props();

  const progress = $derived((value - min) / (max - min || 1));
</script>

<label class="control-label">
  {#if typeof label === "function"}{@render label()}{:else}{label}{/if}
  <div class="range-wrapper" style:--range-progress={progress}>
    <input
      style:--color-slider-track={hasCommonValue ? undefined : "var(--button-bg)"}
      type="range"
      {min}
      {max}
      {step}
      oninput={(event) => {
        onChange(+event.currentTarget.value);
        // controlled input: snap back unless the parent accepted the change
        event.currentTarget.value = String(value);
      }}
      {value}
      class="range-input"
      data-testid={testId}
    />
    <div class="value-bubble">{#if value !== min}{value}{/if}</div>
    <div class="zero-label">
      {#if typeof minLabel === "function"}{@render minLabel()}{:else}{minLabel}{/if}
    </div>
  </div>
</label>
