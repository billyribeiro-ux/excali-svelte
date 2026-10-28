<script lang="ts" generics="T">
  import Icon from "./Icon.svelte";
  import RadioButton from "./RadioButton.svelte";

  import type { IconDef } from "./icons";

  type Option = {
    value: T;
    text: string;
    icon: IconDef;
    testId?: string;
    /** if not supplied, defaults to value identity check */
    active?: boolean;
  };

  type Props = {
    options: Option[];
    value: T | null;
  } & (
    | { type?: "radio"; group: string; onChange: (value: T) => void }
    | {
        type: "button";
        onClick: (value: T, event: MouseEvent) => void;
      }
  );

  let props: Props = $props();
</script>

{#each props.options as option (option.text)}
  {#if props.type === "button"}
    {@const onClick = props.onClick}
    <RadioButton
      icon={option.icon}
      title={option.text}
      testId={option.testId}
      active={option.active ?? props.value === option.value}
      onclick={(event) => onClick(option.value, event)}
    />
  {:else}
    {@const onChange = props.onChange}
    <label class={{ active: props.value === option.value }} title={option.text}>
      <input
        type="radio"
        name={props.group}
        onchange={() => onChange(option.value)}
        checked={props.value === option.value}
        data-testid={option.testId}
      />
      <Icon icon={option.icon} />
    </label>
  {/if}
{/each}
