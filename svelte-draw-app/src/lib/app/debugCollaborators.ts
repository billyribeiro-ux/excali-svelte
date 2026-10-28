import { isDevEnv, toBrandedType } from "@svelte-draw/common";

import type {
  Collaborator,
  SvelteDrawAPI,
  SocketId,
} from "@svelte-draw/editor/types";

/**
 * Dev-only debug helper: `?collaborators=<N>` on the app populates
 * the canvas with N static fake collaborators (random usernames, one of
 * them marked as the current user) so avatar/UserList UI can be exercised
 * without a real collab room or a second browser tab.
 *
 * Not meant to coexist with a real collab session — joining an actual room
 * will overwrite these with the real roster (Collab owns `collaborators`
 * from that point on).
 */

const getSimulatedCollaboratorCountFromUrl = (): number | null => {
  const count = Number(
    new URLSearchParams(window.location.search).get("collaborators"),
  );
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : null;
};

const generateSimulatedCollaborators = async (
  count: number,
): Promise<Map<SocketId, Collaborator>> => {
  const { getRandomUsername } = await import("@excalidraw/random-username");

  const collaborators = new Map<SocketId, Collaborator>();

  for (let i = 0; i < count; i++) {
    const socketId = toBrandedType<SocketId>(`debug-collaborator-${i}`);
    collaborators.set(socketId, {
      id: socketId,
      socketId,
      username: getRandomUsername(),
      isCurrentUser: i === 0,
    });
  }

  return collaborators;
};

/**
 * Replaces the React `useSimulatedCollaborators` hook. Call it once the
 * editor API is available (e.g. from an `$effect` in `App.svelte`); the
 * returned function cancels a still-pending update.
 */
export const startSimulatedCollaborators = (
  excalidrawAPI: SvelteDrawAPI | null,
): (() => void) => {
  if (!isDevEnv() || !excalidrawAPI) {
    return () => {};
  }

  const count = getSimulatedCollaboratorCountFromUrl();
  if (!count) {
    return () => {};
  }

  let cancelled = false;

  generateSimulatedCollaborators(count).then((collaborators) => {
    if (!cancelled) {
      excalidrawAPI.updateScene({ collaborators });
    }
  });

  return () => {
    cancelled = true;
  };
};
