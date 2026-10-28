<script lang="ts">
  import { focusNearestParent, KEYS } from "@svelte-draw/common";

  import { getEditorContext } from "../ui/editorContext";

  import "./TextInput.scss";
  import "./ProjectName.scss";

  type Props = {
    value: string;
    onChange: (value: string) => void;
    label: string;
    ignoreFocus?: boolean;
  };

  let { value, onChange, label, ignoreFocus }: Props = $props();

  const ctx = getEditorContext();

  // initial value only, like the React original's `useState(props.value)`
  // svelte-ignore state_referenced_locally
  let fileName = $state(value);

  const handleBlur = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
    if (!ignoreFocus) {
      focusNearestParent(event.currentTarget);
    }
    const nextValue = event.currentTarget.value;
    if (nextValue !== value) {
      onChange(nextValue);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent & { currentTarget: HTMLInputElement },
  ) => {
    if (event.key === KEYS.ENTER) {
      event.preventDefault();
      if (event.isComposing || event.keyCode === 229) {
        return;
      }
      event.currentTarget.blur();
    }
  };
</script>

<div class="ProjectName">
  <label class="ProjectName-label" for="filename">
    {`${label}:`}
  </label>
  <input
    type="text"
    class="TextInput"
    onblur={handleBlur}
    onkeydown={handleKeyDown}
    id={`${ctx.app.id}-filename`}
    bind:value={fileName}
  />
</div>
