<script lang="ts">
  import { onDestroy } from "svelte";

  import { KEYS, normalizeInputColor } from "@svelte-draw/common";

  import { useAtom, useSetAtom } from "../../editor-jotai";
  import { t } from "../../i18n";
  import { getShortcutKey } from "../../shortcut";
  import { getEditorContext } from "../../ui/editorContext";
  import { activeEyeDropperAtom } from "../EyeDropper";
  import Icon from "../Icon.svelte";
  import { eyeDropperIcon } from "../icons";

  import { activeColorPickerSectionAtom } from "./colorPickerUtils";

  import type { ColorPickerType } from "./colorPickerUtils";

  type Props = {
    color: string;
    onChange: (color: string) => void;
    label: string;
    colorPickerType: ColorPickerType;
    placeholder?: string;
  };

  let { color, onChange, label, colorPickerType, placeholder }: Props =
    $props();

  const ctx = getEditorContext();

  // draft value: follows the `color` prop, but keeps what the user typed until
  // the prop changes
  let innerValue = $derived(color);
  let errorMessage = $state<string | null>(null);

  const activeSection = useAtom(activeColorPickerSectionAtom);
  const eyeDropperState = useAtom(activeEyeDropperAtom);
  const setEyeDropperState = useSetAtom(activeEyeDropperAtom);

  let inputEl = $state<HTMLInputElement | null>(null);
  let eyeDropperTriggerEl = $state<HTMLDivElement | null>(null);

  const shownValue = $derived((innerValue || "").replace(/^#/, ""));

  const changeColor = (inputValue: string) => {
    const value = inputValue.toLowerCase().trim();
    const normalized = normalizeInputColor(value);

    if (normalized) {
      onChange(normalized);
      errorMessage = null;
    } else if (value.length === 0) {
      errorMessage = null;
    } else if (/^#?[0-9a-f]+$/.test(value)) {
      errorMessage = t("colorPicker.invalidHexLength");
    } else {
      errorMessage = t("colorPicker.invalidColor");
    }
    innerValue = value;
  };

  $effect(() => {
    if (activeSection.current === "hex") {
      inputEl?.focus();
    }
  });

  onDestroy(() => {
    setEyeDropperState(null);
  });
</script>

<div class="color-picker__input-label-container">
  <div class={["color-picker__input-label", { "has-error": errorMessage }]}>
    <div class="color-picker__input-hash">#</div>
    <input
      bind:this={inputEl}
      style="border: 0; padding: 0;"
      spellcheck={false}
      class="color-picker-input"
      aria-label={label}
      aria-invalid={!!errorMessage}
      oninput={(event) => {
        const input = event.currentTarget;
        changeColor(input.value);
        // controlled input: always show the (normalized) draft value
        input.value = (innerValue || "").replace(/^#/, "");
      }}
      value={shownValue}
      onblur={() => {
        innerValue = color;
        errorMessage = null;
      }}
      tabindex={-1}
      onfocus={() => {
        activeSection.current = "hex";
      }}
      onkeydown={(event) => {
        if (event.key === KEYS.TAB) {
          return;
        } else if (event.key === KEYS.ESCAPE) {
          eyeDropperTriggerEl?.focus();
        }
        event.stopPropagation();
      }}
      {placeholder}
    />
    <!-- TODO reenable on mobile with a better UX -->
    {#if ctx.editorInterface.formFactor !== "phone"}
      <div
        style="width: 1px; height: 1.25rem; background-color: var(--default-border-color);"
      ></div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div
        bind:this={eyeDropperTriggerEl}
        class={[
          "excalidraw-eye-dropper-trigger",
          { selected: eyeDropperState.current },
        ]}
        onclick={() =>
          setEyeDropperState((s) =>
            s
              ? null
              : {
                  keepOpenOnAlt: false,
                  onSelect: (color) => onChange(color),
                  colorPickerType,
                },
          )}
        title={`${t(
          "labels.eyeDropper",
        )} — ${KEYS.I.toLocaleUpperCase()} or ${getShortcutKey("Alt")} `}
      >
        <Icon icon={eyeDropperIcon} />
      </div>
    {/if}
  </div>
  {#if errorMessage}
    <div class="color-picker__error-message" role="alert">
      {errorMessage}
    </div>
  {/if}
</div>
