<script lang="ts" generics="T">
  import Icon from "./Icon.svelte";

  import "./RadioGroup.scss";

  import type { RadioGroupProps } from "./RadioGroup";

  let { onChange, value, choices, name }: RadioGroupProps<T> = $props();
</script>

<div class="RadioGroup">
  {#each choices as choice (String(choice.value))}
    <div
      class={["RadioGroup__choice", { active: choice.value === value }]}
      title={choice.ariaLabel}
    >
      <input
        {name}
        type="radio"
        checked={choice.value === value}
        onchange={() => onChange(choice.value)}
        aria-label={choice.ariaLabel}
      />
      {#if typeof choice.label === "string"}
        {choice.label}
      {:else}
        <Icon icon={choice.label} />
      {/if}
    </div>
  {/each}
</div>
