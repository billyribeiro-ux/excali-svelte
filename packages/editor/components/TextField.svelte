<script lang="ts">
  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import { eyeIcon, eyeClosedIcon } from "./icons";

  import "./TextField.scss";

  import type { ClassValue } from "svelte/elements";
  import type { IconDef } from "./icons";

  type Props = {
    onChange?: (value: string) => void;
    onkeydown?: (event: KeyboardEvent) => void;

    readonly?: boolean;
    fullWidth?: boolean;
    selectOnRender?: boolean;

    icon?: IconDef;
    label?: string;
    class?: ClassValue;
    placeholder?: string;
    isRedacted?: boolean;
    type?: "text" | "search";
    /** controlled value (mutually exclusive with `defaultValue`) */
    value?: string;
    /** uncontrolled initial value (mutually exclusive with `value`) */
    defaultValue?: string;
    /** the `input` element */
    element?: HTMLInputElement | null;
  };

  let {
    onChange,
    label,
    fullWidth,
    placeholder,
    readonly,
    selectOnRender,
    onkeydown,
    isRedacted = false,
    icon,
    class: className,
    type,
    value,
    defaultValue,
    element = $bindable(null),
  }: Props = $props();

  let isTemporarilyUnredacted = $state(false);

  // (was a layout effect keyed on `selectOnRender`)
  const selectOnMount = (node: HTMLInputElement) => {
    if (selectOnRender) {
      // focusing first is needed because vitest/jsdom
      node.focus();
      node.select();
    }
  };

  const initialValue = (node: HTMLInputElement) => {
    if (value === undefined && defaultValue !== undefined) {
      node.value = defaultValue;
    }
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class={[
    "ExcTextField",
    className,
    {
      "ExcTextField--fullWidth": fullWidth,
      "ExcTextField--hasIcon": !!icon,
    },
  ]}
  onclick={() => {
    element?.focus();
  }}
>
  {#if icon}<Icon {icon} />{/if}
  {#if label}<div class="ExcTextField__label">{label}</div>{/if}
  <div
    class={["ExcTextField__input", { "ExcTextField__input--readonly": readonly }]}
  >
    <input
      class={{
        "is-redacted": !!value && isRedacted && !isTemporarilyUnredacted,
      }}
      readOnly={readonly}
      value={value}
      {placeholder}
      bind:this={element}
      {@attach initialValue}
      {@attach selectOnMount}
      oninput={(event) => {
        onChange?.(event.currentTarget.value);
        // controlled input: snap back unless the parent accepted the change
        if (value !== undefined) {
          event.currentTarget.value = value;
        }
      }}
      {onkeydown}
      {type}
    />
    {#if isRedacted}
      <Button
        onSelect={() => (isTemporarilyUnredacted = !isTemporarilyUnredacted)}
        style="border: 0; user-select: none"
      >
        <Icon icon={isTemporarilyUnredacted ? eyeClosedIcon : eyeIcon} />
      </Button>
    {/if}
  </div>
</div>
