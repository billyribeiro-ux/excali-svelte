<script lang="ts">
  import { MQ_MIN_WIDTH_DESKTOP, type EditorInterface } from "@svelte-draw/common";

  import { t } from "../../i18n";
  import { getEditorContext } from "../../ui/editorContext";
  import Button from "../Button.svelte";
  import Icon from "../Icon.svelte";
  import { share } from "../icons";

  import "./LiveCollaborationTrigger.scss";

  import type { HTMLButtonAttributes } from "svelte/elements";

  type Props = {
    isCollaborating: boolean;
    onSelect: () => void;
    editorInterface?: EditorInterface;
  } & Omit<HTMLButtonAttributes, "class" | "children" | "style" | "title" | "type" | "onselect">;

  let { isCollaborating, onSelect, editorInterface, ...rest }: Props =
    $props();

  const ctx = getEditorContext();

  const showIconOnly = $derived(
    editorInterface?.formFactor !== "desktop" ||
      ctx.appState.width < MQ_MIN_WIDTH_DESKTOP,
  );
</script>

<Button
  {...rest}
  class={["collab-button", { active: isCollaborating }]}
  type="button"
  {onSelect}
  style="position: relative; {showIconOnly ? '' : 'width: auto;'}"
  title={t("labels.liveCollaboration")}
>
  {#if showIconOnly}
    <Icon icon={share} />
  {:else}
    {t("labels.share")}
  {/if}
  {#if ctx.appState.collaborators.size > 0}
    <div class="CollabButton-collaborators">
      {ctx.appState.collaborators.size}
    </div>
  {/if}
</Button>
