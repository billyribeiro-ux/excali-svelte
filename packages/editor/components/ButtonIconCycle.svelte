<script lang="ts" generics="T">
  import Icon from "./Icon.svelte";

  import type { IconDef } from "./icons";

  type Props = {
    options: { value: T; text: string; icon: IconDef }[];
    value: T | null;
    onChange: (value: T) => void;
    group: string;
  };

  let { options, value, onChange, group }: Props = $props();

  const current = $derived(options.find((op) => op.value === value));

  const cycle = () => {
    const index = options.indexOf(current!);
    const next = (index + 1) % options.length;
    onChange(options[next].value);
  };
</script>

<label class={{ active: current!.value !== null }}>
  <input type="button" name={group} onclick={cycle} />
  <Icon icon={current!.icon} />
</label>
