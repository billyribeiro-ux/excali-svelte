<script lang="ts">
  import { untrack } from "svelte";

  import {
    CLASSES,
    EVENT,
    FONT_FAMILY,
    FRAME_STYLE,
    KEYS,
    addEventListener,
    randomInteger,
  } from "@svelte-draw/common";

  import {
    getCommonBounds,
    isElementCompletelyInViewport,
    isFrameLikeElement,
    isTextElement,
    newTextElement,
  } from "@svelte-draw/element";

  import { useAtom } from "../editor-jotai";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Button from "./Button.svelte";
  import Icon from "./Icon.svelte";
  import TextField from "./TextField.svelte";
  import {
    TextIcon,
    collapseDownIcon,
    frameToolIcon,
    searchIcon,
    upIcon,
  } from "./icons";
  import {
    handleSearch,
    searchItemInFocusAtom,
    searchQueryAtom,
    type SearchMatchItem,
    type SearchMatches,
    type SearchQuery,
  } from "./SearchMenu";

  import "./SearchMenu.scss";

  const ctx = getEditorContext();
  const app = ctx.app;

  let inputEl: HTMLInputElement | null = $state(null);

  const inputValue = useAtom(searchQueryAtom);
  const focus = useAtom(searchItemInFocusAtom);

  const searchQuery = $derived(inputValue.current.trim() as SearchQuery);

  let isSearching = $state(false);
  let searchMatches = $state.raw<SearchMatches>({ nonce: null, items: [] });
  let searchedQuery = $state<SearchQuery | null>(null);
  let lastSceneNonce: number | undefined;

  const focusIndex = $derived(focus.current);

  const toAppStateMatches = (matchItems: SearchMatchItem[]) =>
    matchItems.length
      ? {
          focusedId: null,
          matches: matchItems.map((searchMatch) => ({
            id: searchMatch.element.id,
            focus: false,
            matchedLines: searchMatch.matchedLines,
          })),
        }
      : null;

  // re-search when the query or the scene changed (not while the user is
  // typing, the input handler searches itself)
  $effect(() => {
    if (isSearching) {
      return;
    }
    const query = searchQuery;
    // reactive dependency on scene changes
    void ctx.elements;
    untrack(() => {
      if (
        query !== searchedQuery ||
        app.scene.getSceneNonce() !== lastSceneNonce
      ) {
        searchedQuery = null;
        handleSearch(query, app, (matchItems) => {
          searchMatches = { nonce: randomInteger(), items: matchItems };
          searchedQuery = query;
          lastSceneNonce = app.scene.getSceneNonce();
          ctx.setAppState({ searchMatches: toAppStateMatches(matchItems) });
        });
      }
    });
  });

  const goToNextItem = () => {
    if (searchMatches.items.length > 0) {
      const current = focus.current;
      focus.current =
        current === null ? 0 : (current + 1) % searchMatches.items.length;
    }
  };

  const goToPreviousItem = () => {
    if (searchMatches.items.length > 0) {
      const current = focus.current;
      focus.current =
        current === null
          ? 0
          : current - 1 < 0
          ? searchMatches.items.length - 1
          : current - 1;
    }
  };

  // sync the focused match into app state
  $effect(() => {
    const index = focusIndex;
    untrack(() => {
      ctx.setAppState((state) => {
        if (!state.searchMatches) {
          return null;
        }

        const focusedId =
          index !== null ? state.searchMatches?.matches[index]?.id || null : null;

        return {
          searchMatches: {
            focusedId,
            matches: state.searchMatches.matches.map((match, i) => ({
              ...match,
              focus: i === index,
            })),
          },
        };
      });
    });
  });

  // bring the focused match into view
  $effect(() => {
    const index = focusIndex;
    const matches = searchMatches;
    untrack(() => {
      if (matches.items.length > 0 && index !== null) {
        const match = matches.items[index];

        if (match) {
          const zoomValue = app.state.zoom.value;

          const matchAsElement = newTextElement({
            text: match.searchQuery,
            x: match.element.x + (match.matchedLines[0]?.offsetX ?? 0),
            y: match.element.y + (match.matchedLines[0]?.offsetY ?? 0),
            width: match.matchedLines[0]?.width,
            height: match.matchedLines[0]?.height,
            fontSize: isFrameLikeElement(match.element)
              ? FRAME_STYLE.nameFontSize
              : match.element.fontSize,
            fontFamily: isFrameLikeElement(match.element)
              ? FONT_FAMILY.Assistant
              : match.element.fontFamily,
          });

          const FONT_SIZE_LEGIBILITY_THRESHOLD = 14;

          const fontSize = matchAsElement.fontSize;
          const isTextTiny =
            fontSize * zoomValue < FONT_SIZE_LEGIBILITY_THRESHOLD;

          if (
            !isElementCompletelyInViewport(
              [matchAsElement],
              app.canvas.width / app.ownerWindow.devicePixelRatio,
              app.canvas.height / app.ownerWindow.devicePixelRatio,
              {
                offsetLeft: app.state.offsetLeft,
                offsetTop: app.state.offsetTop,
                scrollX: app.state.scrollX,
                scrollY: app.state.scrollY,
                zoom: app.state.zoom,
              },
              app.scene.getNonDeletedElementsMap(),
              app.viewport.getOffsets(),
            ) ||
            isTextTiny
          ) {
            // tiny, illegible text fills the viewport so it becomes readable;
            // otherwise just fit the match into view (capped at 100%)
            const behavior =
              isTextTiny && fontSize < FONT_SIZE_LEGIBILITY_THRESHOLD
                ? "contain"
                : "scale-down";

            app.viewport.setViewport({
              target: getCommonBounds([matchAsElement]),
              fit: behavior,
              animation: { duration: 300 },
              offsets: { ui: true },
            });
          }
        }
      }
    });
  });

  // reset on unmount
  $effect(() => {
    return () => {
      focus.current = null;
      searchedQuery = null;
      lastSceneNonce = undefined;
      ctx.setAppState({ searchMatches: null });
      isSearching = false;
    };
  });

  $effect(() => {
    const eventHandler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key === KEYS.ESCAPE &&
        !app.state.openDialog &&
        !app.state.openPopup
      ) {
        event.preventDefault();
        event.stopPropagation();
        ctx.setAppState({ openSidebar: null });
        return;
      }

      if (event[KEYS.CTRL_OR_CMD] && event.key === KEYS.F) {
        event.preventDefault();
        event.stopPropagation();

        if (app.state.openDialog) {
          return;
        }

        const input = inputEl;
        if (!input?.matches(":focus")) {
          input?.focus();
          input?.select();
        }
      }

      if (
        target instanceof app.ownerWindow.HTMLElement &&
        target.closest(".layer-ui__search")
      ) {
        if (searchMatches.items.length) {
          if (event.key === KEYS.ENTER) {
            event.stopPropagation();
            goToNextItem();
          }

          if (event.key === KEYS.ARROW_UP) {
            event.stopPropagation();
            goToPreviousItem();
          } else if (event.key === KEYS.ARROW_DOWN) {
            event.stopPropagation();
            goToNextItem();
          }
        }
      }
    };

    // `capture` needed to prevent firing on initial open from App,
    // as well as to handle events before App ones
    return addEventListener(app.ownerWindow, EVENT.KEYDOWN, eventHandler, {
      capture: true,
      passive: false,
    });
  });

  const matchCount = $derived(
    `${searchMatches.items.length} ${
      searchMatches.items.length === 1
        ? t("search.singleResult")
        : t("search.multipleResults")
    }`,
  );

  const onInputChange = (value: string) => {
    inputValue.current = value;
    isSearching = true;
    const query = value.trim() as SearchQuery;
    handleSearch(query, app, (matchItems, index) => {
      searchMatches = { nonce: randomInteger(), items: matchItems };
      focus.current = index;
      searchedQuery = query;
      lastSceneNonce = app.scene.getSceneNonce();
      ctx.setAppState({ searchMatches: toAppStateMatches(matchItems) });
      isSearching = false;
    });
  };

  const frameNameMatches = $derived(
    searchMatches.items.filter((match) => isFrameLikeElement(match.element)),
  );
  const textMatches = $derived(
    searchMatches.items.filter((match) => isTextElement(match.element)),
  );

  const scrollIntoViewWhen = (highlighted: boolean) => (node: HTMLElement) => {
    if (highlighted) {
      node.scrollIntoView?.({ behavior: "auto", block: "nearest" });
    }
  };
</script>

{#snippet listItem(match: SearchMatchItem, highlighted: boolean, onclick: () => void)}
  {@const p = match.preview}
  {@const q = searchQuery}
  <div
    tabindex="-1"
    role="presentation"
    class={["layer-ui__result-item", { active: highlighted }]}
    {onclick}
    {@attach scrollIntoViewWhen(highlighted)}
  >
    <div class="preview-text">
      {p.moreBefore ? "..." : ""}{p.previewText.slice(
        0,
        p.indexInSearchQuery,
      )}<b>{p.previewText.slice(
          p.indexInSearchQuery,
          p.indexInSearchQuery + q.length,
        )}</b
      >{p.previewText.slice(p.indexInSearchQuery + q.length)}{p.moreAfter
        ? "..."
        : ""}
    </div>
  </div>
{/snippet}

<div class="layer-ui__search">
  <div class="layer-ui__search-header">
    <TextField
      class={CLASSES.SEARCH_MENU_INPUT_WRAPPER}
      value={inputValue.current}
      placeholder={t("search.placeholder")}
      icon={searchIcon}
      onChange={onInputChange}
      selectOnRender
      bind:element={inputEl}
    />
  </div>

  <div class="layer-ui__search-count">
    {#if searchMatches.items.length > 0}
      {#if focusIndex !== null && focusIndex > -1}
        <div>
          {focusIndex + 1} / {matchCount}
        </div>
      {:else}
        <div>{matchCount}</div>
      {/if}
      <div class="result-nav">
        <Button onSelect={goToNextItem} class="result-nav-btn">
          <Icon icon={collapseDownIcon} />
        </Button>
        <Button onSelect={goToPreviousItem} class="result-nav-btn">
          <Icon icon={upIcon} />
        </Button>
      </div>
    {/if}

    {#if searchMatches.items.length === 0 && searchQuery && searchedQuery}
      <div style="margin: 1rem auto;">{t("search.noMatch")}</div>
    {/if}
  </div>

  <div>
    {#if frameNameMatches.length > 0}
      <div class="layer-ui__search-result-container">
        <div class="layer-ui__search-result-title">
          <div class="title-icon"><Icon icon={frameToolIcon} /></div>
          <div>{t("search.frames")}</div>
        </div>
        {#each frameNameMatches as searchMatch, index (searchMatch.element.id + searchMatch.index)}
          {@render listItem(searchMatch, index === focusIndex, () => {
            focus.current = index;
          })}
        {/each}

        {#if textMatches.length > 0}
          <div class="layer-ui__divider"></div>
        {/if}
      </div>
    {/if}

    {#if textMatches.length > 0}
      <div class="layer-ui__search-result-container">
        <div class="layer-ui__search-result-title">
          <div class="title-icon"><Icon icon={TextIcon} /></div>
          <div>{t("search.texts")}</div>
        </div>
        {#each textMatches as searchMatch, index (searchMatch.element.id + searchMatch.index)}
          {@render listItem(
            searchMatch,
            index + frameNameMatches.length === focusIndex,
            () => {
              focus.current = index + frameNameMatches.length;
            },
          )}
        {/each}
      </div>
    {/if}
  </div>
</div>
