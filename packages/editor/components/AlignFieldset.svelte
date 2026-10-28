<script lang="ts">
  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";

  // The align + distribute fieldset, identical across every styles-panel layout.
  // Button order is mirrored for RTL so the leftmost button always aligns left.
  let { showDistribute }: { showDistribute: boolean } = $props();

  const isRTL = document.documentElement.getAttribute("dir") === "rtl";
</script>

<fieldset>
  <legend>{t("labels.align")}</legend>
  <div class="buttonList align-buttons">
    <div class="align-buttons__row">
      {#if isRTL}
        <ActionPanel name="alignRight" />
        <ActionPanel name="alignHorizontallyCentered" />
        <ActionPanel name="alignLeft" />
      {:else}
        <ActionPanel name="alignLeft" />
        <ActionPanel name="alignHorizontallyCentered" />
        <ActionPanel name="alignRight" />
      {/if}
      {#if showDistribute}
        <ActionPanel name="distributeHorizontally" />
      {/if}
    </div>
    <div class="align-buttons__row">
      <ActionPanel name="alignTop" />
      <ActionPanel name="alignVerticallyCentered" />
      <ActionPanel name="alignBottom" />
      {#if showDistribute}
        <ActionPanel name="distributeVertically" />
      {/if}
    </div>
  </div>
</fieldset>
