import { createContext } from "svelte";

import { createTunnel, type Tunnel } from "../ui/Tunnel.svelte";

export type { Tunnel };

/**
 * One tunnel per "slot" that host-declared (or fallback) content can be
 * teleported into. Replaces the `tunnel-rat` set of the React version.
 *
 * NOTE: the React `tunnelsJotai` member (a `jotai-scope` isolation used by
 * `withInternalFallback` to count mounted host/fallback components per editor
 * instance) is intentionally dropped. In Svelte that bookkeeping is keyed by
 * the tunnels object itself (one per editor instance), see
 * `components/hoc/withInternalFallback.svelte.ts`, so no separate
 * store/isolation is needed.
 */
export type TunnelsContextValue = {
  MainMenuTunnel: Tunnel;
  WelcomeScreenMenuHintTunnel: Tunnel;
  WelcomeScreenToolbarHintTunnel: Tunnel;
  WelcomeScreenHelpHintTunnel: Tunnel;
  WelcomeScreenCenterTunnel: Tunnel;
  FooterCenterTunnel: Tunnel;
  DefaultSidebarTriggerTunnel: Tunnel;
  DefaultSidebarTabTriggersTunnel: Tunnel;
  OverwriteConfirmDialogTunnel: Tunnel;
  TTDDialogTriggerTunnel: Tunnel;
};

/** creates a fresh set of tunnels (call once per editor instance) */
export const createTunnels = (): TunnelsContextValue => ({
  MainMenuTunnel: createTunnel(),
  WelcomeScreenMenuHintTunnel: createTunnel(),
  WelcomeScreenToolbarHintTunnel: createTunnel(),
  WelcomeScreenHelpHintTunnel: createTunnel(),
  WelcomeScreenCenterTunnel: createTunnel(),
  FooterCenterTunnel: createTunnel(),
  DefaultSidebarTriggerTunnel: createTunnel(),
  DefaultSidebarTabTriggersTunnel: createTunnel(),
  OverwriteConfirmDialogTunnel: createTunnel(),
  TTDDialogTriggerTunnel: createTunnel(),
});

/**
 * Alias of {@link createTunnels}, the name `LayerUI.svelte` already imports
 * (it replaces the React `useInitializeTunnels` hook).
 */
export const initializeTunnels = createTunnels;

/**
 * `getTunnels()` replaces `useTunnels()` / `TunnelsContext`; `setTunnels()`
 * is called once by the component that owns the editor UI (`LayerUI`).
 */
export const [getTunnels, setTunnels] = createContext<TunnelsContextValue>();
