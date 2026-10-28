import { DEFAULT_SIDEBAR, KEYS, arrayToMap } from "@svelte-draw/common";

import { actionToggleShapeSwitch } from "../../actions/actionToggleShapeSwitch";
import {
  actionClearCanvas,
  actionLink,
  actionToggleSearchMenu,
  actionToggleTheme,
} from "../../actions";
import {
  actionCopyElementLink,
  actionLinkToElement,
} from "../../actions/actionElementLink";
import { getShortcutFromShortcutName } from "../../actions/shortcuts";
import { deburr } from "../../deburr";
import { editorJotaiStore } from "../../editor-jotai";
import { t } from "../../i18n";
import { getSelectedElements } from "../../scene";
import { activeConfirmDialogAtom } from "../ActiveConfirmDialog";
import { TOOLS, getToolLetter } from "../Tools";
import { canChangeBackgroundColor, canChangeStrokeColor } from "../Actions";
import {
  LockedIcon,
  UnlockedIcon,
  searchIcon,
  boltIcon,
  bucketFillIcon,
  ExportImageIcon,
  mermaidLogoIcon,
  brainIconThin,
  LibraryIcon,
} from "../icons";

import { DEFAULT_CATEGORIES, getCategoryOrder } from "./categories";

import type { MarkRequired } from "@svelte-draw/common/utility-types";
import type { EditorContextValue } from "../../ui/editorContext";
import type { CommandPaletteItem } from "./types";
import type { ToolbarToolType } from "../Tools";
import type { AppProps } from "../../types";
import type { ShortcutName } from "../../actions/shortcuts";
import type { TranslationKeys } from "../../i18n";
import type { Action } from "../../actions/types";

export type ReadyCommand = MarkRequired<
  CommandPaletteItem,
  "haystack" | "order"
>;

export const buildAllCommands = (
  ctx: EditorContextValue,
  customCommandPaletteItems: CommandPaletteItem[] | undefined,
): ReadyCommand[] => {
  const app = ctx.app;
  const uiAppState = ctx.appState;
  const actionManager = ctx.actionManager;
  const appProps = ctx.props;
  const setAppState = ctx.setAppState;

  const getActionLabel = (action: Action) => {
    let label = "";
    if (action.label) {
      if (typeof action.label === "function") {
        label = t(
          action.label(
            app.scene.getNonDeletedElements(),
            uiAppState,
            app,
          ) as unknown as TranslationKeys,
        );
      } else {
        label = t(action.label as unknown as TranslationKeys);
      }
    }
    return label;
  };

  const getActionIcon = (action: Action) => {
    if (typeof action.icon === "function") {
      return action.icon(uiAppState, app.scene.getNonDeletedElements());
    }
    return action.icon;
  };

  let commandsFromActions: CommandPaletteItem[] = [];

  const actionToCommand = (
    action: Action,
    category: string,
    transformer?: (
      command: CommandPaletteItem,
      action: Action,
    ) => CommandPaletteItem,
  ): CommandPaletteItem => {
    const command: CommandPaletteItem = {
      label: getActionLabel(action),
      icon: getActionIcon(action),
      category,
      shortcut: getShortcutFromShortcutName(action.name as ShortcutName),
      keywords: action.keywords,
      predicate: action.predicate,
      viewMode: action.viewMode,
      perform: () => {
        actionManager.executeAction(action, "commandPalette");
      },
    };

    return transformer ? transformer(command, action) : command;
  };

  if (uiAppState && app.scene && actionManager) {
    const elementsCommands: CommandPaletteItem[] = [
      actionManager.actions.group,
      actionManager.actions.ungroup,
      actionManager.actions.cut,
      actionManager.actions.copy,
      actionManager.actions.deleteSelectedElements,
      actionManager.actions.wrapSelectionInFrame,
      actionManager.actions.toggleWrap,
      actionManager.actions.copyStyles,
      actionManager.actions.pasteStyles,
      actionManager.actions.bringToFront,
      actionManager.actions.bringForward,
      actionManager.actions.sendBackward,
      actionManager.actions.sendToBack,
      actionManager.actions.alignTop,
      actionManager.actions.alignBottom,
      actionManager.actions.alignLeft,
      actionManager.actions.alignRight,
      actionManager.actions.alignVerticallyCentered,
      actionManager.actions.alignHorizontallyCentered,
      actionManager.actions.duplicateSelection,
      actionManager.actions.flipHorizontal,
      actionManager.actions.flipVertical,
      actionManager.actions.zoomToFitSelection,
      actionManager.actions.zoomToFitSelectionInViewport,
      actionManager.actions.increaseFontSize,
      actionManager.actions.decreaseFontSize,
      actionManager.actions.toggleLinearEditor,
      actionManager.actions.cropEditor,
      actionManager.actions.togglePolygon,
      actionLink,
      actionCopyElementLink,
      actionLinkToElement,
    ].map((action: Action) =>
      actionToCommand(
        action,
        DEFAULT_CATEGORIES.elements,
        (command, action) => ({
          ...command,
          predicate: action.predicate
            ? action.predicate
            : (elements, appState) => {
                const selectedElements = getSelectedElements(
                  elements,
                  appState,
                );
                return selectedElements.length > 0;
              },
        }),
      ),
    );
    const editorCommands: CommandPaletteItem[] = [
      actionManager.actions.undo,
      actionManager.actions.redo,
      actionManager.actions.zoomIn,
      actionManager.actions.zoomOut,
      actionManager.actions.resetZoom,
      actionManager.actions.zoomToFit,
      actionManager.actions.zenMode,
      actionManager.actions.viewMode,
      actionManager.actions.gridMode,
      actionManager.actions.objectsSnapMode,
      actionManager.actions.showHints,
      actionManager.actions.toggleShortcuts,
      actionManager.actions.selectAll,
      actionManager.actions.toggleElementLock,
      actionManager.actions.unlockAllElements,
      actionManager.actions.stats,
    ].map((action) => actionToCommand(action, DEFAULT_CATEGORIES.editor));

    const exportCommands: CommandPaletteItem[] = [
      actionManager.actions.saveToActiveFile,
      actionManager.actions.saveFileToDisk,
      actionManager.actions.copyAsPng,
      actionManager.actions.copyAsSvg,
    ].map((action) => actionToCommand(action, DEFAULT_CATEGORIES.export));

    commandsFromActions = [
      ...elementsCommands,
      ...editorCommands,
      {
        label: getActionLabel(actionClearCanvas),
        icon: getActionIcon(actionClearCanvas),
        shortcut: getShortcutFromShortcutName(
          actionClearCanvas.name as ShortcutName,
        ),
        category: DEFAULT_CATEGORIES.editor,
        keywords: ["delete", "destroy"],
        viewMode: false,
        perform: () => {
          editorJotaiStore.set(activeConfirmDialogAtom, "clearCanvas");
        },
      },
      {
        label: t("buttons.exportImage"),
        category: DEFAULT_CATEGORIES.export,
        icon: ExportImageIcon,
        shortcut: getShortcutFromShortcutName("imageExport"),
        keywords: [
          "export",
          "image",
          "png",
          "jpeg",
          "svg",
          "clipboard",
          "picture",
        ],
        perform: () => {
          setAppState({ openDialog: { name: "imageExport" } });
        },
      },
      ...exportCommands,
    ];

    const additionalCommands: CommandPaletteItem[] = [
      actionToCommand(actionToggleTheme, DEFAULT_CATEGORIES.app),
      {
        label: t("toolBar.library"),
        category: DEFAULT_CATEGORIES.app,
        icon: LibraryIcon,
        viewMode: false,
        perform: () => {
          if (uiAppState.openSidebar) {
            setAppState({
              openSidebar: null,
            });
          } else {
            setAppState({
              openSidebar: {
                name: DEFAULT_SIDEBAR.name,
                tab: DEFAULT_SIDEBAR.defaultTab,
              },
            });
          }
        },
      },
      {
        label: t("search.title"),
        category: DEFAULT_CATEGORIES.app,
        icon: searchIcon,
        viewMode: true,
        perform: () => {
          actionManager.executeAction(actionToggleSearchMenu);
        },
      },
      {
        label: t("labels.shapeSwitch"),
        category: DEFAULT_CATEGORIES.elements,
        icon: boltIcon,
        perform: () => {
          actionManager.executeAction(actionToggleShapeSwitch);
        },
      },
      {
        label: t("labels.changeStroke"),
        keywords: ["color", "outline"],
        category: DEFAULT_CATEGORIES.elements,
        icon: bucketFillIcon,
        viewMode: false,
        predicate: (elements, appState) => {
          const selectedElements = getSelectedElements(elements, appState);
          return (
            selectedElements.length > 0 &&
            canChangeStrokeColor(appState, selectedElements)
          );
        },
        perform: () => {
          setAppState(() => ({
            openPopup: "elementStroke",
          }));
        },
      },
      {
        label: t("labels.changeBackground"),
        keywords: ["color", "fill"],
        icon: bucketFillIcon,
        category: DEFAULT_CATEGORIES.elements,
        viewMode: false,
        predicate: (elements, appState) => {
          const selectedElements = getSelectedElements(elements, appState);
          return (
            selectedElements.length > 0 &&
            canChangeBackgroundColor(
              appState,
              selectedElements,
              arrayToMap(elements),
            )
          );
        },
        perform: () => {
          setAppState(() => ({
            openPopup: "elementBackground",
          }));
        },
      },
      {
        label: t("labels.canvasBackground"),
        keywords: ["color"],
        icon: bucketFillIcon,
        category: DEFAULT_CATEGORIES.editor,
        viewMode: false,
        perform: () => {
          setAppState((prevState) => ({
            openMenu: prevState.openMenu === "canvas" ? null : "canvas",
            openPopup: "canvasBackground",
          }));
        },
      },
      ...(Object.keys(TOOLS) as ToolbarToolType[]).reduce(
        (acc: CommandPaletteItem[], value) => {
          const config = TOOLS[value];

          if (
            appProps.UIOptions.tools?.[
              value as Extract<
                typeof value,
                keyof AppProps["UIOptions"]["tools"]
              >
            ] === false
          ) {
            return acc;
          }

          const shortcut = getToolLetter(value) || config.numericKey;

          const command: CommandPaletteItem = {
            label: t(`toolBar.${value}`),
            category: DEFAULT_CATEGORIES.tools,
            shortcut,
            icon: config.icon,
            keywords: ["toolbar"],
            viewMode: false,
            perform: () => {
              app.setActiveTool({ type: value }, { toggle: false });
            },
          };

          acc.push(command);

          return acc;
        },
        [],
      ),
      {
        label: t("toolBar.lock"),
        category: DEFAULT_CATEGORIES.tools,
        icon: uiAppState.activeTool.locked ? LockedIcon : UnlockedIcon,
        shortcut: KEYS.Q.toLocaleUpperCase(),
        viewMode: false,
        perform: () => {
          app.toggleLock();
        },
      },
      {
        label: `${t("labels.textToDiagram")}...`,
        category: DEFAULT_CATEGORIES.tools,
        icon: brainIconThin,
        viewMode: false,
        predicate: appProps.aiEnabled,
        perform: () => {
          setAppState((state) => ({
            ...state,
            openDialog: {
              name: "ttd",
              tab: "text-to-diagram",
            },
          }));
        },
      },
      {
        label: `${t("toolBar.mermaidToExcalidraw")}...`,
        category: DEFAULT_CATEGORIES.tools,
        icon: mermaidLogoIcon,
        viewMode: false,
        // Mermaid conversion runs locally: it must stay available when the AI
        // backend is not configured (`aiEnabled={false}`)
        perform: () => {
          setAppState((state) => ({
            ...state,
            openDialog: {
              name: "ttd",
              tab: "mermaid",
            },
          }));
        },
      },
      // {
      //   label: `${t("toolBar.magicframe")}...`,
      //   category: DEFAULT_CATEGORIES.tools,
      //   icon: MagicIconThin,
      //   viewMode: false,
      //   predicate: appProps.aiEnabled,
      //   perform: () => {
      //     app.onMagicframeToolSelect();
      //   },
      // },
    ];

    const allCommands = [
      ...commandsFromActions,
      ...additionalCommands,
      ...(customCommandPaletteItems || []),
    ].map((command) => {
      return {
        ...command,
        icon: command.icon || boltIcon,
        order: command.order ?? getCategoryOrder(command.category),
        haystack: `${deburr(command.label.toLocaleLowerCase())} ${
          command.keywords?.join(" ") || ""
        }`,
      };
    });

    return allCommands;
  }
  return [];
};
