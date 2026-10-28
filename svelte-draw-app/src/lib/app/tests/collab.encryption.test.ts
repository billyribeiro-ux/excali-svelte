/**
 * Runs the REAL `Collab` + `Portal` against the Svelte editor with a recording
 * socket, real WebCrypto and a no-op Firebase layer. Proves that
 *  - inbound `client-broadcast` payloads are decrypted with the room key from
 *    the link and applied to the scene,
 *  - payloads encrypted with another key are rejected (scene untouched),
 *  - everything `Collab` emits to the server is ciphertext.
 */
import { newElement, syncInvalidIndices } from "@svelte-draw/element";
import {
  encryptData,
  generateEncryptionKey,
} from "@svelte-draw/editor/data/encryption";
import SvelteDraw from "@svelte-draw/editor/components/SvelteDraw.svelte";
import { render, waitFor } from "@svelte-draw/editor/tests/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SvelteDrawAPI } from "@svelte-draw/editor/types";

import { WS_EVENTS, WS_SUBTYPES } from "../app_constants.ts";
import {
  appAtomStore,
  collabAPIAtom,
  isCollaboratingAtom,
} from "../app-atoms.ts";
import Collab from "../collab/Collab.ts";
import { LocalData } from "../data/LocalData.ts";

// `newElement` does not accept an `id`; tests need stable ids
const newElementWithId = (id: string, opts: Parameters<typeof newElement>[0]) =>
  ({ ...newElement(opts), id } as ReturnType<typeof newElement>);

const SECRET = "TOP-SECRET-MARKER-42";

vi.mock("../data/firebase.ts", () => ({
  loadFromFirebase: async () => null,
  saveToFirebase: async () => null,
  isSavedToFirebase: () => true,
  loadFilesFromFirebase: async () => ({
    loadedFiles: [],
    erroredFiles: new Map(),
  }),
  saveFilesToFirebase: async () => ({ savedFiles: [], erroredFiles: [] }),
}));

const socketState = vi.hoisted(() => ({
  handlers: new Map<string, (...args: any[]) => any>(),
  emit: undefined as any,
}));

vi.mock("socket.io-client", () => ({
  default: () => ({
    id: "socket-self",
    close: () => {},
    on: (event: string, cb: (...args: any[]) => any) => {
      socketState.handlers.set(event, cb);
    },
    once: (event: string, cb: (...args: any[]) => any) => {
      socketState.handlers.set(`once:${event}`, cb);
    },
    off: (event: string) => {
      socketState.handlers.delete(event);
    },
    emit: (...args: any[]) => socketState.emit(...args),
  }),
}));

const isArrayBuffer = (v: unknown) =>
  Object.prototype.toString.call(v) === "[object ArrayBuffer]";

const latin1 = (v: ArrayBuffer | Uint8Array) => {
  const view = v instanceof Uint8Array ? v : new Uint8Array(v);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    out += String.fromCharCode(view[i]);
  }
  return out;
};

const encryptedUpdate = async (key: string, elements: unknown[]) => {
  const { encryptedBuffer, iv } = await encryptData(
    key,
    new TextEncoder().encode(
      JSON.stringify({
        type: WS_SUBTYPES.UPDATE,
        payload: { elements },
      }),
    ),
  );
  return [encryptedBuffer, iv] as const;
};

describe("Collab (end-to-end encrypted transport)", () => {
  let api: SvelteDrawAPI;
  let collab: Collab;
  let roomKey: string;

  beforeEach(async () => {
    socketState.handlers.clear();
    socketState.emit = vi.fn();
    roomKey = await generateEncryptionKey();

    await render(SvelteDraw, {
      props: {
        onExcalidrawAPI: (a: SvelteDrawAPI | null) => {
          if (a) {
            api = a;
          }
        },
      },
    });
    await waitFor(() => expect(api).toBeDefined());

    collab = new Collab(api);
    collab.start();
    // joining an existing room link (key comes from the link hash)
    collab.startCollaboration({ roomId: "room-1", roomKey });
    await waitFor(() =>
      expect(socketState.handlers.has("client-broadcast")).toBe(true),
    );
  });

  afterEach(() => {
    collab.stopCollaboration(false);
    collab.destroy();
  });

  it("publishes its API and collaboration state through the app atoms", () => {
    expect(appAtomStore.get(collabAPIAtom)?.isCollaborating()).toBe(true);
    expect(appAtomStore.get(isCollaboratingAtom)).toBe(true);
    expect(LocalData.isSavePaused()).toBe(true);
  });

  it("clears the published API on destroy()", () => {
    collab.stopCollaboration(false);
    collab.destroy();
    expect(appAtomStore.get(collabAPIAtom)).toBeNull();
    expect(appAtomStore.get(isCollaboratingAtom)).toBe(false);
  });

  it("applies an inbound payload encrypted with the room key", async () => {
    const remote = syncInvalidIndices([
      newElementWithId("remote-rect", {
        type: "rectangle",
        x: 5,
        y: 6,
        width: 10,
        height: 10,
      }),
    ]);
    const [buffer, iv] = await encryptedUpdate(roomKey, remote);

    await socketState.handlers.get("client-broadcast")!(buffer, iv);

    await waitFor(() =>
      expect(api.getSceneElements().map((e) => e.id)).toContain("remote-rect"),
    );
  });

  it("rejects an inbound payload encrypted with a different key", async () => {
    const otherKey = await generateEncryptionKey();
    const remote = syncInvalidIndices([
      newElementWithId("evil-rect", { type: "rectangle", x: 0, y: 0 }),
    ]);
    const [buffer, iv] = await encryptedUpdate(otherKey, remote);

    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      await socketState.handlers.get("client-broadcast")!(buffer, iv);
      expect(alert).toHaveBeenCalledTimes(1);
      expect(api.getSceneElements().map((e) => e.id)).not.toContain(
        "evil-rect",
      );
    } finally {
      alert.mockRestore();
      consoleError.mockRestore();
    }
  });

  it("everything Collab emits to the server is ciphertext", async () => {
    // become initialized (as when we are first in the room)
    await socketState.handlers.get("first-in-room")!();

    const element = syncInvalidIndices([
      newElementWithId("local-rect", {
        type: "rectangle",
        x: 1,
        y: 1,
        width: 10,
        height: 10,
        link: `https://example.test/${SECRET}`,
      }),
    ]);
    api.updateScene({ elements: element });
    collab.syncElements(api.getSceneElementsIncludingDeleted());

    await waitFor(() => {
      expect(
        socketState.emit.mock.calls.some(
          (c: any[]) => c[0] === WS_EVENTS.SERVER,
        ),
      ).toBe(true);
    });

    for (const call of socketState.emit.mock.calls) {
      const [event, , buffer, iv] = call;
      if (event !== WS_EVENTS.SERVER && event !== WS_EVENTS.SERVER_VOLATILE) {
        continue;
      }
      expect(isArrayBuffer(buffer)).toBe(true);
      expect(iv.length).toBe(12);
      expect(latin1(buffer)).not.toContain(SECRET);
      expect(
        JSON.stringify(call.filter((a: unknown) => typeof a === "string")),
      ).not.toContain(roomKey);
    }
  });
});
