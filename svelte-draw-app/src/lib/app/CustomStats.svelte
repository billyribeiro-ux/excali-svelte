<script lang="ts">
  import { StatsRow, StatsRows } from "@svelte-draw/editor";
  import { copyTextToSystemClipboard } from "@svelte-draw/editor/clipboard";
  import { t } from "@svelte-draw/editor/i18n";
  import {
    DEFAULT_VERSION,
    debounce,
    getVersion,
    nFormatter,
  } from "@svelte-draw/common";

  import {
    getElementsStorageSize,
    getTotalStorageSize,
  } from "#lib/app/data/localStorage.ts";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";
  import type { UIAppState } from "@svelte-draw/editor/types";

  type StorageSizes = { scene: number; total: number };

  type Props = {
    setToast: (message: string) => void;
    elements: readonly NonDeletedExcalidrawElement[];
    appState: UIAppState;
  };

  const STORAGE_SIZE_TIMEOUT = 500;

  let { setToast, elements, appState }: Props = $props();

  const getStorageSizes = debounce((cb: (sizes: StorageSizes) => void) => {
    cb({
      scene: getElementsStorageSize(),
      total: getTotalStorageSize(),
    });
  }, STORAGE_SIZE_TIMEOUT);

  let storageSizes = $state<StorageSizes>({ scene: 0, total: 0 });

  // re-measure (debounced) whenever the scene or the app state changes
  $effect(() => {
    // dependencies
    void elements;
    void appState;

    getStorageSizes((sizes) => {
      storageSizes = sizes;
    });
  });

  // cancel a pending measurement on unmount only (a cleanup in the effect
  // above would cancel it on every change, defeating the debounce)
  $effect(() => () => getStorageSizes.cancel());

  const version = getVersion();
  const hasVersion = version !== DEFAULT_VERSION;
  const hash = hasVersion ? version.slice(21) : undefined;
  const timestamp = $derived(
    hasVersion
      ? version.slice(0, 16).replace("T", " ")
      : t("stats.versionNotAvailable"),
  );
</script>

<StatsRows order={-1}>
  <StatsRow heading>{t("stats.version")}</StatsRow>
  <StatsRow
    style="text-align: center; cursor: pointer;"
    onclick={async () => {
      try {
        await copyTextToSystemClipboard(getVersion());
        setToast(t("toast.copyToClipboard"));
      } catch {
        // clipboard unavailable or denied: the copy is best-effort
      }
    }}
    title={t("stats.versionCopy")}
  >
    {timestamp}<br />{hash}
  </StatsRow>

  <StatsRow heading>{t("stats.storage")}</StatsRow>
  <StatsRow columns={2}>
    <div>{t("stats.scene")}</div>
    <div>{nFormatter(storageSizes.scene, 1)}</div>
  </StatsRow>
  <StatsRow columns={2}>
    <div>{t("stats.total")}</div>
    <div>{nFormatter(storageSizes.total, 1)}</div>
  </StatsRow>
</StatsRows>
