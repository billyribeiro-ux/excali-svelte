import { createContext } from "svelte";

import { atom } from "../../editor-jotai";

import type { Snippet } from "svelte";
import type { ClassValue } from "svelte/elements";
import type { IconDef } from "../icons";
import type { AppState, SidebarName, SidebarTabName } from "../../types";

export type SidebarTriggerProps = {
  name: SidebarName;
  tab?: SidebarTabName;
  icon?: IconDef;
  children?: Snippet;
  title?: string;
  class?: ClassValue;
  onToggle?: (open: boolean) => void;
  /** inline CSS string (React took a CSSProperties object) */
  style?: string;
};

export type SidebarProps = {
  name: SidebarName;
  children?: Snippet;
  /**
   * Called on sidebar open/close or tab change.
   */
  onStateChange?: (state: AppState["openSidebar"]) => void;
  /**
   * supply alongside `docked` prop in order to make the Sidebar user-dockable
   */
  onDock?: (docked: boolean) => void;
  docked?: boolean;
  class?: ClassValue;
  // NOTE sidebars we use internally inside the editor must have this flag set.
  // It indicates that this sidebar should have lower precedence over host
  // sidebars, if both are open.
  /** @private internal */
  __fallback?: boolean;
  /** the sidebar's root element (the React `ref`) */
  element?: HTMLDivElement | null;
};

export type SidebarPropsContextValue = Pick<
  SidebarProps,
  "onDock" | "docked"
> & { onCloseRequest: () => void; shouldRenderDockButton: boolean };

/**
 * Provided by `<Sidebar>` to `<Sidebar.Header>`. The value is an object of
 * getters, so consumers stay reactive to the sidebar's props (the React
 * version re-created the context value to force a re-render).
 */
export const [
  getSidebarPropsContext,
  setSidebarPropsContext,
  hasSidebarPropsContext,
] = createContext<SidebarPropsContextValue>();

/**
 * Flags whether the currently rendered Sidebar is docked or not, for use
 * in upstream components that need to act on this (e.g. LayerUI to shift the
 * UI). We use an atom because of potential host app sidebars (for the default
 * sidebar we could just read from appState.defaultSidebarDockedPreference).
 *
 * Since we can only render one Sidebar at a time, we can use a simple flag.
 */
export const isSidebarDockedAtom = atom(false);
