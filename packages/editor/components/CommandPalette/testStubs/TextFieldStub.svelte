<script lang="ts">
  let {
    value,
    placeholder,
    onChange,
  }: {
    value: string;
    placeholder?: string;
    onChange?: (value: string) => void;
  } = $props();
</script>

<div class="ExcTextField">
  <input
    {value}
    {placeholder}
    oninput={(event) => onChange?.(event.currentTarget.value)}
  />
</div>
