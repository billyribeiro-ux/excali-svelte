<script lang="ts">
  import { Popover } from "bits-ui";

  import { isShallowEqual } from "@svelte-draw/common";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";
  import UIContent from "../ui/UIContent.svelte";

  import Icon from "./Icon.svelte";
  import { chevronDownIcon } from "./icons";
  import Island from "./Island.svelte";
  import QuickSearch from "./QuickSearch.svelte";
  import ScrollableList from "./ScrollableList.svelte";
  import Tooltip from "./Tooltip.svelte";

  import "./UserList.scss";

  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ClassValue } from "svelte/elements";
  import type { UIContent as UIContentType } from "../ui/content";
  import type { Collaborator, SocketId } from "../types";
  import type { UserListUserObject } from "./UserList";

  const DEFAULT_MAX_AVATARS = 4;
  const SHOW_COLLABORATORS_FILTER_AT = 8;

  // avatar (28px) + gap (10px)
  const AVATAR_SLOT_WIDTH = 38;
  // the current user's pill (avatar + chevron + its own padding/border) is
  // wider than a plain avatar — reserving this extra width for it keeps it
  // from ever being the item that tips the row over and wraps onto its own
  // line (chevron 15px + pill's right padding 4px + pill's border 2px)
  const PILL_EXTRA_WIDTH = 21;

  const collaboratorComparatorKeys = [
    "avatarUrl",
    "id",
    "socketId",
    "username",
    "isInCall",
    "isSpeaking",
    "isMuted",
    "isCurrentUser",
  ] as const;

  type Props = {
    class?: ClassValue;
    mobile?: boolean;
    collaborators: Map<SocketId, UserListUserObject>;
    userToFollow: SocketId | null;
    /** a snippet receives `isMobile` */
    currentUserControls?: UIContentType | Snippet<[isMobile: boolean]>;
  };

  let {
    class: className,
    mobile,
    collaborators,
    userToFollow,
    currentUserControls,
  }: Props = $props();

  type ListedCollaborator = UserListUserObject & { socketId: SocketId };

  // The collaborators map is replaced on every update (e.g. each pointer
  // move). Like the `React.memo` comparator of the React version, keep handing
  // out the previous array while nothing relevant (the compared keys and
  // their order) changed, so nothing downstream re-evaluates.
  let previous: {
    source: Map<SocketId, UserListUserObject>;
    list: ListedCollaborator[];
  } | null = null;

  const collaboratorsArray = $derived.by(() => {
    const source = collaborators;

    const isSame =
      previous !== null &&
      previous.source.size === source.size &&
      (() => {
        const nextSocketIds = source.keys();
        for (const [socketId, collaborator] of previous.source) {
          const nextCollaborator = source.get(socketId);
          if (
            !nextCollaborator ||
            // this checks order of collaborators in the map is the same
            // as previous render
            socketId !== nextSocketIds.next().value ||
            !isShallowEqual(
              collaborator,
              nextCollaborator,
              collaboratorComparatorKeys,
            )
          ) {
            return false;
          }
        }
        return true;
      })();

    if (previous && isSame) {
      return previous.list;
    }

    const list = Array.from(source, ([socketId, collaborator]) => ({
      ...collaborator,
      socketId,
    })).filter((collaborator) => collaborator.username?.trim());
    previous = { source, list };
    return list;
  });

  const currentUser = $derived(collaboratorsArray.find((c) => c.isCurrentUser));
  const otherCollaborators = $derived(
    collaboratorsArray.filter((c) => !c.isCurrentUser),
  );

  let searchTerm = $state("");
  const filteredCollaborators = $derived(
    collaboratorsArray.filter((collaborator) =>
      collaborator.username?.toLowerCase().includes(searchTerm),
    ),
  );

  let wrapperWidth = $state(DEFAULT_MAX_AVATARS * AVATAR_SLOT_WIDTH);

  const observeWrapperWidth: Attachment<HTMLDivElement> = (wrapper) => {
    const ownerWindow = wrapper.ownerDocument.defaultView;

    wrapperWidth = wrapper.clientWidth;

    if (!ownerWindow || typeof ownerWindow.ResizeObserver !== "function") {
      return;
    }

    const resizeObserver = new ownerWindow.ResizeObserver((entries) => {
      for (const entry of entries) {
        wrapperWidth = entry.contentRect.width;
      }
    });

    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  };

  // the current user's avatar is always shown, reserved as the last
  // slot — it's the single entry point for the collaborators +
  // currentUserControls dropdown, so it's never hidden by/counted in
  // overflow. Its width (wider than a plain avatar) is carved out of the
  // available width up front so it always shares a row with the other
  // avatars — if there's only room for the pill itself, it renders alone
  // rather than wrapping onto its own line.
  const availableWidth = $derived(
    currentUser ? wrapperWidth - PILL_EXTRA_WIDTH : wrapperWidth,
  );
  const totalSlots = $derived(
    Math.max(1, Math.min(8, Math.floor(availableWidth / AVATAR_SLOT_WIDTH))),
  );
  const otherSlots = $derived(
    currentUser ? Math.max(0, totalSlots - 1) : totalSlots,
  );
  const visibleOthers = $derived(otherCollaborators.slice(0, otherSlots));

  const firstNCollaborators = $derived(
    currentUser ? [...visibleOthers, currentUser] : visibleOthers,
  );

  const hasControls = $derived(!!currentUserControls);
</script>

{#snippet controls()}
  {#if typeof currentUserControls === "function"}
    {@render (currentUserControls as Snippet<[boolean]>)(!!mobile)}
  {:else if currentUserControls}
    <UIContent content={currentUserControls} />
  {/if}
{/snippet}

{#snippet avatar(
  collaborator: ListedCollaborator,
  withName: boolean,
)}
  <ActionPanel
    name="goToCollaborator"
    data={{
      socketId: collaborator.socketId,
      collaborator: collaborator as Collaborator,
      withName,
      isBeingFollowed: collaborator.socketId === userToFollow,
    }}
  />
{/snippet}

{#snippet collaboratorItem(
  collaborator: ListedCollaborator,
  withName: boolean,
  shouldWrapWithTooltip: boolean,
)}
  {#if shouldWrapWithTooltip}
    <Tooltip label={collaborator.username || "Unknown user"}>
      {@render avatar(collaborator, withName)}
    </Tooltip>
  {:else}
    {@render avatar(collaborator, withName)}
  {/if}
{/snippet}

{#if mobile}
  <div class={["UserList UserList_mobile", className]}>
    <div class="UserList_mobile__avatars">
      {#each collaboratorsArray as collaborator (collaborator.socketId)}
        {@render collaboratorItem(collaborator, false, true)}
      {/each}
    </div>
    {#if hasControls}
      <div class="UserList__menu-divider"></div>
      {@render controls()}
    {/if}
  </div>
{:else}
  <div class="UserList__wrapper" {@attach observeWrapperWidth}>
    <div
      class={["UserList", className]}
      style:--max-avatars={firstNCollaborators.length +
        (currentUser ? PILL_EXTRA_WIDTH / AVATAR_SLOT_WIDTH : 0)}
    >
      {#each firstNCollaborators as collaborator (collaborator.socketId)}
        {#if !collaborator.isCurrentUser}
          {@render collaboratorItem(collaborator, false, true)}
        {:else}
          <!-- current user's avatar is the single entry point for the "who's
               here" list + currentUserControls dropdown -->
          <Popover.Root>
            <Popover.Trigger>
              {#snippet child({ props })}
                {@const { type: _type, ...pillProps } = props}
                <div {...pillProps} class={["UserList__pill", pillProps.class]}>
                  {@render collaboratorItem(collaborator, false, true)}
                  <div class="UserList__pill-chevron">
                    <Icon icon={chevronDownIcon} />
                  </div>
                </div>
              {/snippet}
            </Popover.Trigger>
            <Popover.Content
              class="focus-visible-none"
              style="z-index: 2; width: 15rem; text-align: left;"
              align="end"
              sideOffset={10}
            >
              <Island padding={2}>
                {#if collaboratorsArray.length >= SHOW_COLLABORATORS_FILTER_AT}
                  <QuickSearch
                    placeholder={t("quickSearch.placeholder")}
                    onChange={(term) => (searchTerm = term)}
                  />
                {/if}
                <ScrollableList
                  class="dropdown-menu UserList__collaborators"
                  placeholder={t("userList.empty")}
                  isEmpty={filteredCollaborators.length === 0}
                >
                  <div class="hint">
                    {t("userList.hint.text")}
                  </div>
                  {#each filteredCollaborators as c (c.socketId)}
                    {@render collaboratorItem(c, true, false)}
                  {/each}
                </ScrollableList>
                {#if hasControls}
                  <div class="UserList__menu-divider"></div>
                  <Popover.Close>
                    {#snippet child({ props: closeProps })}
                      <div {...closeProps} class="dropdown-menu">
                        {@render controls()}
                      </div>
                    {/snippet}
                  </Popover.Close>
                {/if}
                <Popover.Arrow
                  width={20}
                  height={10}
                  style="fill: var(--popup-bg-color); filter: drop-shadow(rgba(0, 0, 0, 0.05) 0px 3px 2px);"
                />
              </Island>
            </Popover.Content>
          </Popover.Root>
        {/if}
      {/each}
    </div>
  </div>
{/if}
