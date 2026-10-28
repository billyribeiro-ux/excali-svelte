<script lang="ts">
  import Icon from "./Icon.svelte";
  import { searchIcon } from "./icons";

  import "./QuickSearch.scss";

  import type { ClassValue } from "svelte/elements";

  type Props = {
    class?: ClassValue;
    placeholder: string;
    onChange: (term: string) => void;
    /** the `input` element */
    element?: HTMLInputElement | null;
  };

  let {
    class: className,
    placeholder,
    onChange,
    element = $bindable(null),
  }: Props = $props();
</script>

<div class={["QuickSearch__wrapper", className]}>
  <Icon icon={searchIcon} />
  <input
    bind:this={element}
    class="QuickSearch__input"
    type="text"
    {placeholder}
    oninput={(event) => onChange(event.currentTarget.value.trim().toLowerCase())}
  />
</div>
