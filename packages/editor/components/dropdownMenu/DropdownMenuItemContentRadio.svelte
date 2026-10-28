<script lang="ts" generics="T">
  import { getEditorContext } from "../../ui/editorContext";
  import Ellipsify from "../Ellipsify.svelte";
  import Icon from "../Icon.svelte";
  import RadioGroup from "../RadioGroup.svelte";

  import type { Snippet } from "svelte";
  import type { IconDef } from "../icons";
  import type { RadioGroupChoice } from "../RadioGroup";

  type Props = {
    value: T;
    shortcut?: string;
    choices: RadioGroupChoice<T>[];
    onChange: (value: T) => void;
    children: Snippet;
    name: string;
    icon?: IconDef;
  };

  let { value, shortcut, onChange, choices, children, name, icon }: Props =
    $props();

  const ctx = getEditorContext();
</script>

<div class="dropdown-menu-item-base dropdown-menu-item-bare">
  {#if icon}
    <div class="dropdown-menu-item__icon"><Icon {icon} /></div>
  {/if}
  <label class="dropdown-menu-item__text">
    <Ellipsify>{@render children()}</Ellipsify>
  </label>
  <RadioGroup {name} {value} {onChange} {choices} />
</div>
{#if shortcut && ctx.editorInterface.formFactor !== "phone"}
  <div
    class="dropdown-menu-item__shortcut dropdown-menu-item__shortcut--orphaned"
  >
    {shortcut}
  </div>
{/if}
