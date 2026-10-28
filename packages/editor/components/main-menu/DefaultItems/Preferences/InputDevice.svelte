<script lang="ts">
  import { resolveInputDevice } from "../../../../appState";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemContentRadio from "../../../dropdownMenu/DropdownMenuItemContentRadio.svelte";
  import { emptyIcon } from "../../../icons";

  import type { InputDevice } from "../../../../types";

  const ctx = getEditorContext();
</script>

<!-- `auto` isn't offered yet; the radio shows what it resolves to -->
<DropdownMenuItemContentRadio
  name="inputDevice"
  icon={emptyIcon}
  value={resolveInputDevice(ctx.appState.inputDevice)}
  onChange={(value: Exclude<InputDevice, "auto">) => {
    ctx.setAppState({
      inputDevice: value,
    });
  }}
  choices={[
    {
      value: "trackpad",
      label: t("labels.inputDeviceTrackpad"),
      ariaLabel: t("labels.inputDeviceTrackpad"),
    },
    {
      value: "mouse",
      label: t("labels.inputDeviceMouse"),
      ariaLabel: t("labels.inputDeviceMouse"),
    },
  ]}
>
  {t("labels.inputDevice")}
</DropdownMenuItemContentRadio>
