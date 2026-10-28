<script lang="ts">
  import { CLASSES } from "@svelte-draw/common";

  import ActionPanel from "../actions/ActionPanel.svelte";

  import "./Actions.scss";
  import StackCol from "./StackCol.svelte";
  import StackRow from "./StackRow.svelte";
</script>

<StackCol gap={1} class={CLASSES.ZOOM_ACTIONS}>
  <StackRow align="center">
    <ActionPanel name="zoomOut" />
    <ActionPanel name="resetZoom" />
    <ActionPanel name="zoomIn" />
  </StackRow>
</StackCol>
