<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import RadioSelection from "../../components/RadioSelection.svelte";
  import {
    strokeVariabilityConstantIcon,
    strokeVariabilityVariableIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type {
    ExcalidrawFreeDrawElement,
    StrokeVariability,
  } from "@svelte-draw/element/types";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app, data }: ActionPanelProps =
    $props();

  const strokeVariability = $derived(
    getFormValue(
      elements,
      app,
      (element) =>
        (element as ExcalidrawFreeDrawElement).strokeOptions?.variability,
      (element) => element.type === "freedraw",
      (hasSelection) =>
        hasSelection ? null : appState.currentItemStrokeVariability,
    ) ?? appState.currentItemStrokeVariability,
  );
  const isVariable = $derived(strokeVariability === "variable");
</script>

{#if data?.cycle}
  <!-- in the compact UI the pressure setting is rendered as a single button
       that cycles between the two variability modes on click -->
  <IconButton
    type="button"
    icon={isVariable
      ? strokeVariabilityVariableIcon
      : strokeVariabilityConstantIcon}
    title={t("labels.pressure")}
    aria-label={t("labels.pressure")}
    onclick={() => updateData(isVariable ? "constant" : "variable")}
  />
{:else}
  <fieldset>
    <legend>{t("labels.pressure")}</legend>
    <div class="buttonList">
      <RadioSelection
        group="strokeOptions.variability"
        options={[
          {
            value: "constant",
            text: t("labels.pressure_constant"),
            icon: strokeVariabilityConstantIcon,
          },
          {
            value: "variable",
            text: t("labels.pressure_variable"),
            icon: strokeVariabilityVariableIcon,
          },
        ]}
        value={strokeVariability}
        onChange={(value: StrokeVariability) => updateData(value)}
      />
    </div>
  </fieldset>
{/if}
