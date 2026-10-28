<script lang="ts">
  import "./Switch.scss";

  import type { SwitchProps } from "./Switch";

  let { title, name, checked, onChange, disabled = false }: SwitchProps =
    $props();
</script>

<div class={["Switch", { toggled: checked, disabled }]}>
  <input
    {name}
    id={name}
    {title}
    type="checkbox"
    {checked}
    {disabled}
    onchange={(event) => {
      onChange(!checked);
      // controlled input: snap back unless the parent accepted the change
      event.currentTarget.checked = checked;
    }}
    onkeydown={(event) => {
      if (event.key === " ") {
        onChange(!checked);
      }
    }}
  />
</div>
