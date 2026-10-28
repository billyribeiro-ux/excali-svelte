<script lang="ts" module>
  import { atom } from "../../editor-jotai";

  import type { CommandPaletteItem } from "./types";

  /** exported for tests (reset between runs) */
  export const lastUsedPaletteItem = atom<CommandPaletteItem | null>(null);
</script>

<script lang="ts">
  import fuzzy from "fuzzy";
  import { untrack } from "svelte";

  import { KEYS, isWritableElement } from "@svelte-draw/common";

  import type { MarkRequired } from "@svelte-draw/common/utility-types";

  import { getShortcutKey } from "../../shortcut";
  import { deburr } from "../../deburr";
  import { useAtom } from "../../editor-jotai";
  import { t } from "../../i18n";
  import {
    distributeLibraryItemsOnSquareGrid,
    libraryItemsAtom,
  } from "../../data/library";
  import { getEditorContext } from "../../ui/editorContext";
  import Dialog from "../Dialog.svelte";
  import Icon from "../Icon.svelte";
  import TextField from "../TextField.svelte";
  import { searchIcon, historyCommandIcon } from "../icons";

  import CommandItem from "./CommandItem.svelte";
  import CommandShortcutHint from "./CommandShortcutHint.svelte";
  import { buildAllCommands, type ReadyCommand } from "./buildCommands";
  import {
    getCategoryOrder,
    isCommandPaletteToggleShortcut,
  } from "./categories";

  import "./CommandPalette.scss";

  import type { AppState, LibraryItem } from "../../types";

  type Props = {
    customCommandPaletteItems?: CommandPaletteItem[];
  };

  let { customCommandPaletteItems }: Props = $props();

  const ctx = getEditorContext();

  // the commands are computed once when the palette opens: they are not
  // updated on appState/appProps changes while the palette is open
  const allCommands = untrack(() =>
    buildAllCommands(ctx, customCommandPaletteItems),
  );

  const lastUsedAtom = useAtom(lastUsedPaletteItem);
  const libraryItemsAtomValue = useAtom(libraryItemsAtom);

  const libraryCommands: CommandPaletteItem[] = $derived(
    libraryItemsAtomValue.current.libraryItems
      ?.filter(
        (libraryItem): libraryItem is MarkRequired<LibraryItem, "name"> =>
          !!libraryItem.name,
      )
      .map((libraryItem) => ({
        label: libraryItem.name,
        libraryIcon: { id: libraryItem.id, elements: libraryItem.elements },
        category: "Library",
        order: getCategoryOrder("Library"),
        haystack: deburr(libraryItem.name),
        perform: () => {
          ctx.app.onInsertElements(
            distributeLibraryItemsOnSquareGrid([libraryItem]),
          );
        },
      })) || [],
  );

  // re-resolve the last used command against the current command list
  untrack(() => {
    const previous = lastUsedAtom.current;
    lastUsedAtom.current =
      [...allCommands, ...libraryCommands].find(
        (command) => command.label === previous?.label,
      ) ?? null;
  });

  const lastUsed = $derived(lastUsedAtom.current);

  let commandSearch = $state("");
  /** explicit selection by keyboard/mouse; `undefined` = follow the default */
  let selectedOverride = $state.raw<CommandPaletteItem | null | undefined>(
    undefined,
  );

  const isCommandAvailable = (command: CommandPaletteItem) => {
    const uiAppState = ctx.appState;
    if (command.viewMode === false && uiAppState.viewModeEnabled) {
      return false;
    }

    return typeof command.predicate === "function"
      ? command.predicate(
          ctx.app.scene.getNonDeletedElements(),
          uiAppState as AppState,
          ctx.props,
          ctx.app,
        )
      : command.predicate === undefined || command.predicate;
  };

  const showLastUsed = $derived(
    !commandSearch && !!lastUsed && !!isCommandAvailable(lastUsed),
  );

  const matchingCommands = $derived.by((): CommandPaletteItem[] => {
    const available = allCommands
      .filter(isCommandAvailable)
      .sort((a, b) => a.order - b.order);

    if (!commandSearch) {
      return available;
    }

    const candidates: ReadyCommand[] | CommandPaletteItem[] =
      commandSearch.length > 1
        ? [...available, ...(libraryCommands as ReadyCommand[])]
        : available;

    const query = deburr(
      commandSearch.toLocaleLowerCase().replace(/[<>_| -]/g, ""),
    );
    return fuzzy
      .filter(query, candidates as CommandPaletteItem[], {
        extract: (command) => command.haystack ?? "",
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.original);
  });

  const commandsByCategory = $derived.by(() => {
    const commands =
      showLastUsed && lastUsed
        ? matchingCommands.filter((command) => command.label !== lastUsed.label)
        : matchingCommands;

    const byCategory: Record<string, CommandPaletteItem[]> = {};
    for (const command of commands) {
      (byCategory[command.category] ??= []).push(command);
    }
    return byCategory;
  });

  const defaultCommand = $derived(
    showLastUsed ? lastUsed : (matchingCommands[0] ?? null),
  );
  const currentCommand = $derived(
    selectedOverride !== undefined ? selectedOverride : defaultCommand,
  );

  const isPhone = $derived(ctx.app.editorInterface.formFactor === "phone");

  const setSearch = (value: string) => {
    commandSearch = value;
    selectedOverride = undefined;
  };

  const closeCommandPalette = (cb?: () => void) => {
    ctx.setAppState({ openDialog: null }, cb);
    setSearch("");
  };

  const executeCommand = (
    command: CommandPaletteItem,
    event: MouseEvent | KeyboardEvent,
  ) => {
    if (ctx.appState.openDialog?.name === "commandPalette") {
      event.stopPropagation();
      event.preventDefault();
      const { ownerDocument, ownerWindow } = ctx.app;
      ownerDocument.body.classList.add("excalidraw-animations-disabled");
      closeCommandPalette(() => {
        command.perform({ actionManager: ctx.actionManager, event });
        lastUsedAtom.current = command;

        ownerWindow.requestAnimationFrame(() => {
          ownerDocument.body.classList.remove(
            "excalidraw-animations-disabled",
          );
        });
      });
    }
  };

  const focusInput = () => {
    ctx.app.ownerDocument
      .querySelector<HTMLInputElement>(
        ".command-palette-dialog .ExcTextField input",
      )
      ?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const ignoreAlphanumerics =
      isWritableElement(event.target) ||
      isCommandPaletteToggleShortcut(event) ||
      event.key === KEYS.ESCAPE;

    if (
      ignoreAlphanumerics &&
      event.key !== KEYS.ARROW_UP &&
      event.key !== KEYS.ARROW_DOWN &&
      event.key !== KEYS.ENTER
    ) {
      return;
    }

    const matching = Object.values(commandsByCategory).flat();
    const shouldConsiderLastUsed = showLastUsed;

    if (event.key === KEYS.ARROW_UP) {
      event.preventDefault();
      const index = matching.findIndex(
        (item) => item.label === currentCommand?.label,
      );

      if (shouldConsiderLastUsed) {
        if (index === 0) {
          selectedOverride = lastUsed;
          return;
        }

        if (currentCommand === lastUsed) {
          const nextItem = matching[matching.length - 1];
          if (nextItem) {
            selectedOverride = nextItem;
          }
          return;
        }
      }

      let nextIndex;

      if (index === -1) {
        nextIndex = matching.length - 1;
      } else {
        nextIndex =
          index === 0 ? matching.length - 1 : (index - 1) % matching.length;
      }

      const nextItem = matching[nextIndex];
      if (nextItem) {
        selectedOverride = nextItem;
      }

      return;
    }

    if (event.key === KEYS.ARROW_DOWN) {
      event.preventDefault();
      const index = matching.findIndex(
        (item) => item.label === currentCommand?.label,
      );

      if (shouldConsiderLastUsed) {
        if (!currentCommand || index === matching.length - 1) {
          selectedOverride = lastUsed;
          return;
        }

        if (currentCommand === lastUsed) {
          const nextItem = matching[0];
          if (nextItem) {
            selectedOverride = nextItem;
          }
          return;
        }
      }

      const nextIndex = (index + 1) % matching.length;
      const nextItem = matching[nextIndex];
      if (nextItem) {
        selectedOverride = nextItem;
      }

      return;
    }

    if (event.key === KEYS.ENTER) {
      if (currentCommand) {
        const command = currentCommand;
        setTimeout(() => {
          executeCommand(command, event);
        });
      }
    }

    if (ignoreAlphanumerics) {
      return;
    }

    // prevent regular editor shortcuts
    event.stopPropagation();

    // if alphanumeric keypress and we're not inside the input, focus it
    if (/^[a-zA-Z0-9]$/.test(event.key)) {
      focusInput();
      return;
    }

    event.preventDefault();
  };
</script>

<svelte:window onkeydowncapture={handleKeyDown} />

<Dialog
  onCloseRequest={() => closeCommandPalette()}
  closeOnClickOutside
  title={false}
  size={720}
  autofocus
  class="command-palette-dialog"
>
  <TextField
    value={commandSearch}
    placeholder={t("commandPalette.search.placeholder")}
    onChange={setSearch}
    selectOnRender
  />

  {#if !isPhone}
    <div class="shortcuts-wrapper">
      <CommandShortcutHint shortcut="↑↓">
        {t("commandPalette.shortcuts.select")}
      </CommandShortcutHint>
      <CommandShortcutHint shortcut="↵">
        {t("commandPalette.shortcuts.confirm")}
      </CommandShortcutHint>
      <CommandShortcutHint shortcut={getShortcutKey("Esc")}>
        {t("commandPalette.shortcuts.close")}
      </CommandShortcutHint>
    </div>
  {/if}

  <div class="commands">
    {#if lastUsed && !commandSearch}
      {@const recent = lastUsed}
      <div class="command-category">
        <div class="command-category-title">
          {t("commandPalette.recents")}
          <div class="icon" style="margin-left: 6px;">
            <Icon icon={historyCommandIcon} />
          </div>
        </div>
        <CommandItem
          command={recent}
          isSelected={recent.label === currentCommand?.label}
          onclick={(event) => executeCommand(recent, event)}
          disabled={!isCommandAvailable(recent)}
          onmousemove={() => (selectedOverride = recent)}
          showShortcut={!isPhone}
          appState={ctx.appState}
        />
      </div>
    {/if}

    {#if Object.keys(commandsByCategory).length > 0}
      {#each Object.keys(commandsByCategory) as category (category)}
        <div class="command-category">
          <div class="command-category-title">{category}</div>
          {#each commandsByCategory[category] as command (command.label)}
            <CommandItem
              {command}
              isSelected={command.label === currentCommand?.label}
              onclick={(event) => executeCommand(command, event)}
              onmousemove={() => (selectedOverride = command)}
              showShortcut={!isPhone}
              appState={ctx.appState}
              size={category === "Library" ? "large" : "small"}
            />
          {/each}
        </div>
      {/each}
    {:else}
      <div class="no-match">
        <div class="icon"><Icon icon={searchIcon} /></div>
        {t("commandPalette.search.noMatch")}
      </div>
    {/if}
  </div>
</Dialog>
