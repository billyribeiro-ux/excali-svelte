<script lang="ts">
  import Icon from "./Icon.svelte";
  import { checkIcon } from "./icons";

  import "./CheckboxItem.scss";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    checked: boolean;
    onChange: (checked: boolean, event: MouseEvent) => void;
    class?: ClassValue;
    children?: Snippet;
  };

  let { checked, onChange, class: className, children }: Props = $props();
</script>

<!-- the inner `.Checkbox-box` button is the keyboard-focusable control; clicking
  anywhere on the row toggles it and moves focus there (DOM kept as original) -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class={["Checkbox", className, { "is-checked": checked }]}
  onclick={(event) => {
    onChange(!checked, event);
    event.currentTarget.querySelector<HTMLButtonElement>(".Checkbox-box")!.focus();
  }}
>
  <button
    type="button"
    class="Checkbox-box"
    role="checkbox"
    aria-checked={checked}
  >
    <Icon icon={checkIcon} />
  </button>
  <div class="Checkbox-label">{@render children?.()}</div>
</div>
