<script lang="ts">
  import { THEME } from "@svelte-draw/common";

  import { t } from "../i18n";
  import { exportScene } from "../scene/export";

  import IconButton from "./IconButton.svelte";
  import { CloseIcon } from "./icons";

  import type { LibraryItem, UIAppState } from "../types";

  type Props = {
    libItem: LibraryItem;
    appState: UIAppState;
    index: number;
    onChange: (val: string, index: number) => void;
    onRemove: (id: string) => void;
  };

  let { libItem, appState, index, onChange, onRemove }: Props = $props();

  /** renders the library item preview svg into the node */
  const renderPreview = (node: HTMLElement) => {
    const elements = libItem.elements;
    const theme = appState.exportWithDarkMode ? THEME.DARK : THEME.LIGHT;
    let cancelled = false;
    exportScene({
      type: "svg",
      data: { elements, files: null },
      config: {
        skipInliningFonts: true,
        canvasBackgroundColor: "#fff",
        theme,
      },
    }).then((svg) => {
      if (!cancelled) {
        node.innerHTML = svg.outerHTML;
      }
    });
    return () => {
      cancelled = true;
    };
  };
</script>

<div class="single-library-item">
  {#if libItem.status === "published"}
    <span class="single-library-item-status">
      {t("labels.statusPublished")}
    </span>
  {/if}
  <div class="single-library-item__svg" {@attach renderPreview}></div>
  <IconButton
    aria-label={t("buttons.remove")}
    type="button"
    icon={CloseIcon}
    class="single-library-item--remove"
    onclick={() => onRemove(libItem.id)}
    title={t("buttons.remove")}
  />
  <div
    style="display: flex; margin: 0.8rem 0; width: 100%; font-size: 14px; font-weight: 500; flex-direction: column"
  >
    <label
      style="display: flex; justify-content: space-between; flex-direction: column"
    >
      <div style="padding: 0.5em 0">
        <span style="font-weight: 500; color: #868e96">
          {t("publishDialog.itemName")}
        </span>
        <span aria-hidden="true" class="required">*</span>
      </div>
      <input
        type="text"
        style="width: 80%; padding: 0.2rem"
        value={libItem.name}
        placeholder="Item name"
        oninput={(event) => onChange(event.currentTarget.value, index)}
      />
    </label>
    <span class="error">{libItem.error}</span>
  </div>
</div>
