import { describe, expect, it } from "vitest";

import { createTunnels, initializeTunnels } from "./tunnels";

const TUNNEL_NAMES = [
  "MainMenuTunnel",
  "WelcomeScreenMenuHintTunnel",
  "WelcomeScreenToolbarHintTunnel",
  "WelcomeScreenHelpHintTunnel",
  "WelcomeScreenCenterTunnel",
  "FooterCenterTunnel",
  "DefaultSidebarTriggerTunnel",
  "DefaultSidebarTabTriggersTunnel",
  "OverwriteConfirmDialogTunnel",
  "TTDDialogTriggerTunnel",
] as const;

describe("tunnels", () => {
  it("creates the full set of named tunnels, each distinct and empty", () => {
    const tunnels = createTunnels();

    expect(Object.keys(tunnels).sort()).toEqual([...TUNNEL_NAMES].sort());
    expect(new Set(Object.values(tunnels)).size).toBe(TUNNEL_NAMES.length);
    for (const name of TUNNEL_NAMES) {
      expect(tunnels[name].hasContent).toBe(false);
    }
  });

  it("creates independent sets per editor instance", () => {
    const a = createTunnels();
    const b = createTunnels();

    for (const name of TUNNEL_NAMES) {
      expect(a[name]).not.toBe(b[name]);
    }
  });

  it("exposes `initializeTunnels` as an alias", () => {
    expect(initializeTunnels).toBe(createTunnels);
  });
});
