<script lang="ts">
  import clsx from "clsx";

  import { getClientColor } from "../../clients";
  import Avatar from "../../components/Avatar.svelte";
  import {
    eyeIcon,
    microphoneIcon,
    microphoneMutedIcon,
  } from "../../components/icons";
  import { t } from "../../i18n";

  import type { GoToCollaboratorComponentProps } from "../../components/UserList";
  import type { Collaborator } from "../../types";
  import type { ActionPanelProps } from "../types";

  let { updateData, data }: ActionPanelProps = $props();

  const { socketId, collaborator, withName, isBeingFollowed } = $derived(
    data as GoToCollaboratorComponentProps,
  );

  const background = $derived(getClientColor(socketId, collaborator));

  const statusClassNames = $derived(
    clsx({
      "is-followed": isBeingFollowed,
      "is-current-user": collaborator.isCurrentUser === true,
      "is-speaking": collaborator.isSpeaking,
      "is-in-call": collaborator.isInCall,
      "is-muted": collaborator.isMuted,
    }),
  );
</script>

{#snippet statusIcon()}
  {#if collaborator.isInCall}
    {#if collaborator.isSpeaking}
      <div
        class="UserList__collaborator-status-icon-speaking-indicator"
        title={t("userList.hint.isSpeaking")}
      >
        <div></div>
        <div></div>
        <div></div>
      </div>
    {:else if collaborator.isMuted}
      <div
        class="UserList__collaborator-status-icon-microphone-muted"
        title={t("userList.hint.micMuted")}
      >
        {@html microphoneMutedIcon.html}
      </div>
    {:else}
      <div title={t("userList.hint.inCall")}>{@html microphoneIcon.html}</div>
    {/if}
  {/if}
{/snippet}

{#if withName}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="dropdown-menu-item dropdown-menu-item-base UserList__collaborator {statusClassNames}"
    style="--avatar-size: 1.5rem"
    onclick={collaborator.isCurrentUser
      ? undefined
      : () => updateData<Collaborator>(collaborator)}
  >
    <Avatar
      color={background}
      onclick={() => {}}
      name={collaborator.username || ""}
      src={collaborator.avatarUrl}
      class={statusClassNames}
    />
    <div class="UserList__collaborator-name">
      {collaborator.username}
    </div>
    <div class="UserList__collaborator-status-icons" aria-hidden="true">
      {#if isBeingFollowed}
        <div
          class="UserList__collaborator-status-icon-is-followed"
          title={t("userList.hint.followStatus")}
        >
          {@html eyeIcon.html}
        </div>
      {/if}
      {#if collaborator.isCurrentUser}{` (${t("labels.you")})`}{/if}
      {@render statusIcon()}
    </div>
  </div>
{:else}
  <div
    class="UserList__collaborator UserList__collaborator--avatar-only {statusClassNames}"
  >
    <Avatar
      color={background}
      onclick={() => {
        updateData(collaborator);
      }}
      name={collaborator.username || ""}
      src={collaborator.avatarUrl}
      class={statusClassNames}
    />
    {#if collaborator.isInCall}
      <div class="UserList__collaborator-status-icon">
        {@render statusIcon()}
      </div>
    {/if}
  </div>
{/if}
