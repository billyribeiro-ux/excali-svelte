<script lang="ts" generics="T">
  import { Popover } from "bits-ui";

  import { isArrowKey, KEYS } from "@svelte-draw/common";

  import { useAtom } from "../editor-jotai";
  import { getLanguage, t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Icon from "./Icon.svelte";
  import Collapsible from "./Stats/Collapsible.svelte";
  import {
    DEFAULT_SECTION_NAME,
    flattenOptions,
    getNavigationRows,
    hasOption,
    moreOptionsAtom,
  } from "./IconPicker";

  import type { Option, PickerSection } from "./IconPicker";

  import "./IconPicker.scss";

  type Props = {
    label: string;
    value: T;
    visibleSections: readonly PickerSection<T>[];
    hiddenSections?: readonly PickerSection<T>[];
    onChange: (value: T) => void;
    onClose: () => void;
  };

  let {
    visibleSections,
    hiddenSections = [],
    value,
    label,
    onChange,
    onClose,
  }: Props = $props();

  const ctx = getEditorContext();
  const showMoreOptions = useAtom(moreOptionsAtom);

  const allOptions = $derived(
    flattenOptions([...visibleSections, ...hiddenSections]),
  );
  const navigationRows = $derived(
    getNavigationRows([
      ...visibleSections,
      ...(showMoreOptions.current ? hiddenSections : []),
    ]),
  );

  const handleKeyDown = (event: KeyboardEvent) => {
    const pressedOption = allOptions.find(
      (option) => option.keyBinding === event.key.toLowerCase(),
    );

    if (!(event.metaKey || event.altKey || event.ctrlKey) && pressedOption) {
      // Keybinding navigation
      onChange(pressedOption.value);

      event.preventDefault();
    } else if (event.key === KEYS.TAB) {
      const index = allOptions.findIndex((option) => option.value === value);
      const nextIndex = event.shiftKey
        ? (allOptions.length + index - 1) % allOptions.length
        : (index + 1) % allOptions.length;
      onChange(allOptions[nextIndex].value);
    } else if (isArrowKey(event.key)) {
      // Arrow navigation
      const isRTL = getLanguage().rtl;
      const index = allOptions.findIndex((option) => option.value === value);
      if (index !== -1) {
        const length = allOptions.length;
        let nextIndex = index;

        switch (event.key) {
          // Select the next option
          case isRTL ? KEYS.ARROW_LEFT : KEYS.ARROW_RIGHT:
            nextIndex = (index + 1) % length;
            break;
          // Select the previous option
          case isRTL ? KEYS.ARROW_RIGHT : KEYS.ARROW_LEFT:
            nextIndex = (length + index - 1) % length;
            break;
          // Go the next row
          case KEYS.ARROW_DOWN: {
            const currentRowIndex = navigationRows.findIndex((row) =>
              row.some((option) => option.value === value),
            );
            const currentRow = navigationRows[currentRowIndex];

            if (currentRowIndex !== -1 && currentRow) {
              const column = currentRow.findIndex(
                (option) => option.value === value,
              );
              const nextRow =
                navigationRows[(currentRowIndex + 1) % navigationRows.length];
              const nextOption =
                nextRow[Math.min(column, nextRow.length - 1)] ??
                allOptions[index];

              onChange(nextOption.value);
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
              return;
            }
            break;
          }
          // Go the previous row
          case KEYS.ARROW_UP: {
            const currentRowIndex = navigationRows.findIndex((row) =>
              row.some((option) => option.value === value),
            );
            const currentRow = navigationRows[currentRowIndex];

            if (currentRowIndex !== -1 && currentRow) {
              const column = currentRow.findIndex(
                (option) => option.value === value,
              );
              const previousRow =
                navigationRows[
                  (navigationRows.length + currentRowIndex - 1) %
                    navigationRows.length
                ];
              const previousOption =
                previousRow[Math.min(column, previousRow.length - 1)] ??
                allOptions[index];

              onChange(previousOption.value);
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
              return;
            }
            break;
          }
        }

        onChange(allOptions[nextIndex].value);
      }
      event.preventDefault();
    } else if (event.key === KEYS.ESCAPE || event.key === KEYS.ENTER) {
      // Close on escape or enter
      event.preventDefault();
      onClose();
    }
    event.stopImmediatePropagation();
    event.stopPropagation();
  };

  $effect(() => {
    if (hasOption(hiddenSections, (option) => option.value === value)) {
      showMoreOptions.current = true;
    }
  });

  // focus the active option (after a tick, to render focus properly)
  const focusIfActive = (option: Option<T>) => (el: HTMLButtonElement) => {
    if (value === option.value) {
      const ownerWindow = el.ownerDocument.defaultView ?? window;
      const timeout = ownerWindow.setTimeout(() => {
        el.focus();
      }, 0);
      return () => ownerWindow.clearTimeout(timeout);
    }
  };
</script>

{#snippet moreOptionsLabel()}{t("labels.more_options")}{/snippet}

{#snippet renderOptions(options: readonly Option<T>[])}
  <div class="picker-content">
    {#each options as option (option.text)}
      <button
        {@attach focusIfActive(option)}
        type="button"
        class={["picker-option", { active: value === option.value }]}
        onclick={() => {
          onChange(option.value);
        }}
        title={option.keyBinding
          ? `${option.text} — ${option.keyBinding.toUpperCase()}`
          : option.text}
        aria-label={option.text || "none"}
        aria-keyshortcuts={option.keyBinding || undefined}
      >
        <Icon icon={option.icon} />
        {#if option.keyBinding}
          <span class="picker-keybinding">{option.keyBinding}</span>
        {/if}
      </button>
    {/each}
  </div>
{/snippet}

{#snippet renderSections(sections: readonly PickerSection<T>[])}
  {#each sections as section, index (`${section.name}-${index}`)}
    {#if section.name === DEFAULT_SECTION_NAME}
      {@render renderOptions(section.options)}
    {:else}
      <div class="picker-section">
        <div class="picker-section-label">{section.name}</div>
        {@render renderOptions(section.options)}
      </div>
    {/if}
  {/each}
{/snippet}

<Popover.Content
  class="picker"
  role="dialog"
  aria-modal="true"
  aria-label={label}
  side="bottom"
  align="start"
  sideOffset={12}
  alignOffset={12}
  style="z-index: var(--zIndex-ui-styles-popup)"
  trapFocus={false}
  onkeydown={handleKeyDown}
  collisionBoundary={ctx.container ?? undefined}
>
  <div class="picker-sections">
    {@render renderSections(visibleSections)}

    {#if hiddenSections.length > 0}
      <Collapsible
        label={moreOptionsLabel}
        open={showMoreOptions.current}
        openTrigger={() => {
          showMoreOptions.current = !showMoreOptions.current;
        }}
        class="picker-collapsible"
      >
        <div class="picker-sections">
          {@render renderSections(hiddenSections)}
        </div>
      </Collapsible>
    {/if}
  </div>
</Popover.Content>
