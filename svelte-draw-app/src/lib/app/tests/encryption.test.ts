/**
 * Security tests for the end-to-end encryption paths of the app services.
 *
 * They run the REAL `Portal`, `data/firebase.ts`, `data/index.ts` and
 * `FileManager.ts` code against real WebCrypto (AES-GCM through
 * `packages/editor/data/encryption.ts`). Only the network boundaries are
 * replaced by recorders (socket.io socket, Firebase SDK, `fetch`) so we can
 * assert what a server would actually receive.
 */
import { syncInvalidIndices, newElement } from "@svelte-draw/element";
import { decompressData } from "@svelte-draw/editor/data/encode";
import {
  decryptData,
  generateEncryptionKey,
} from "@svelte-draw/editor/data/encryption";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BinaryFileData,
  DataURL,
  AppState,
  SocketId,
} from "@svelte-draw/editor/types";
import type { FileId } from "@svelte-draw/element/types";

import { WS_EVENTS, WS_SUBTYPES } from "../app_constants.ts";
import { encodeFilesForUpload } from "../data/FileManager.ts";
import {
  loadFilesFromFirebase,
  loadFromFirebase,
  saveFilesToFirebase,
  saveToFirebase,
} from "../data/firebase.ts";
import {
  exportToBackend,
  getSyncableElements,
  importFromBackend,
} from "../data/index.ts";
import Portal from "../collab/Portal.ts";

import type { SyncableExcalidrawElement } from "../data/index.ts";
import type { TCollabClass } from "../collab/Collab.ts";
import type { Socket } from "socket.io-client";

// ---------------------------------------------------------------------------
// Firebase SDK recorder (in-memory Firestore + Storage)
// ---------------------------------------------------------------------------
const fb = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  uploads: [] as { path: string; data: Uint8Array; metadata?: unknown }[],
}));

// The flows under test need the optional backends; configure them explicitly
// (the real defaults are EMPTY, see notConfigured.test.ts for that case).
vi.mock("../app_config.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../app_config.ts")>()),
  BACKEND_V2_GET_URL: "https://share.example.test/api/v2/",
  BACKEND_V2_POST_URL: "https://share.example.test/api/v2/post/",
  FIREBASE_CONFIG: { projectId: "test-project", storageBucket: "test-bucket" },
  isShareLinkConfigured: true,
}));

vi.mock("../data/firebaseSDK.ts", () => {
  class Bytes {
    constructor(private readonly bytes: Uint8Array) {}
    static fromUint8Array(bytes: Uint8Array) {
      return new Bytes(bytes);
    }
    toUint8Array() {
      return this.bytes;
    }
  }
  return {
    initializeApp: () => ({}),
    getFirestore: () => ({}),
    getStorage: () => ({}),
    Bytes,
    doc: (_fs: unknown, collection: string, id: string) => ({
      path: `${collection}/${id}`,
    }),
    getDoc: async (ref: { path: string }) => ({
      exists: () => fb.docs.has(ref.path),
      data: () => fb.docs.get(ref.path),
    }),
    runTransaction: async (
      _fs: unknown,
      fn: (tx: unknown) => Promise<unknown>,
    ) =>
      fn({
        get: async (ref: { path: string }) => ({
          exists: () => fb.docs.has(ref.path),
          data: () => fb.docs.get(ref.path),
        }),
        set: (ref: { path: string }, data: Record<string, unknown>) =>
          fb.docs.set(ref.path, data),
        update: (ref: { path: string }, data: Record<string, unknown>) =>
          fb.docs.set(ref.path, { ...fb.docs.get(ref.path), ...data }),
      }),
    ref: (_storage: unknown, path: string) => ({ path }),
    uploadBytes: async (
      ref: { path: string },
      data: Uint8Array,
      metadata?: unknown,
    ) => {
      fb.uploads.push({ path: ref.path, data, metadata });
    },
  };
});

// `newElement` does not accept an `id`; tests need stable ids
const newElementWithId = (id: string, opts: Parameters<typeof newElement>[0]) =>
  ({ ...newElement(opts), id } as ReturnType<typeof newElement>);

const SECRET = "TOP-SECRET-MARKER-42";
const SECRET_USERNAME = "secret-username-77";

const latin1 = (bytes: ArrayBuffer | Uint8Array) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (let i = 0; i < view.length; i++) {
    out += String.fromCharCode(view[i]);
  }
  return out;
};

// jsdom and Node have different realms, so `instanceof ArrayBuffer` is unreliable
const isArrayBuffer = (v: unknown) =>
  Object.prototype.toString.call(v) === "[object ArrayBuffer]";
const isUint8Array = (v: unknown) =>
  Object.prototype.toString.call(v) === "[object Uint8Array]";

const toBytes = (v: ArrayBuffer | Uint8Array) =>
  v instanceof Uint8Array ? v : new Uint8Array(v);

const createSecretElements = () =>
  syncInvalidIndices([
    newElementWithId("rect-1", {
      type: "rectangle",
      x: 1,
      y: 2,
      width: 10,
      height: 10,
      link: `https://example.test/${SECRET}`,
    }),
  ]) as unknown as SyncableExcalidrawElement[];

const makeFakeSocket = () => {
  const emit = vi.fn();
  const socket = {
    id: "socket-self",
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    emit,
    close: vi.fn(),
  };
  return { socket: socket as unknown as Socket, emit };
};

describe("end-to-end encryption", () => {
  let roomKey: string;

  beforeEach(async () => {
    fb.docs.clear();
    fb.uploads.length = 0;
    roomKey = await generateEncryptionKey();
  });

  describe("room key", () => {
    it("is a 128-bit AES-GCM key (22 base64url chars) generated locally", async () => {
      expect(roomKey).toMatch(/^[a-zA-Z0-9_-]{22}$/);
      expect(await generateEncryptionKey()).not.toBe(roomKey);
    });
  });

  describe("Portal (websocket)", () => {
    const setup = () => {
      const { socket, emit } = makeFakeSocket();
      const collab = {
        fileManager: {
          saveFiles: async () => ({
            savedFiles: new Map(),
            erroredFiles: new Map(),
          }),
          shouldUpdateImageElementStatus: () => false,
        },
        excalidrawAPI: {
          getSceneElementsIncludingDeleted: () => [],
          getFiles: () => ({}),
          getAppState: () => ({ selectedElementIds: {} }),
          updateScene: vi.fn(),
        },
        state: { username: SECRET_USERNAME },
        getSceneElementsIncludingDeleted: () => [],
        setCollaborators: vi.fn(),
      } as unknown as TCollabClass;

      const portal = new Portal(collab);
      portal.open(socket, "room-id-1", roomKey);
      portal.socketInitialized = true;
      return { portal, emit };
    };

    it("broadcastScene emits only ciphertext + iv, and it decrypts back", async () => {
      const { portal, emit } = setup();
      const elements = createSecretElements();

      await portal.broadcastScene(WS_SUBTYPES.UPDATE, elements, false);

      const call = emit.mock.calls.find((c) => c[0] === WS_EVENTS.SERVER);
      expect(call).toBeDefined();
      const [event, roomId, encryptedBuffer, iv] = call!;
      expect(event).toBe(WS_EVENTS.SERVER);
      expect(roomId).toBe("room-id-1");
      expect(isArrayBuffer(encryptedBuffer)).toBe(true);
      expect(isUint8Array(iv)).toBe(true);
      expect(iv.length).toBe(12);

      // nothing the server receives may contain the plaintext or the key
      for (const arg of call!) {
        const serialized =
          isArrayBuffer(arg) || isUint8Array(arg)
            ? latin1(arg)
            : JSON.stringify(arg);
        expect(serialized).not.toContain(SECRET);
        expect(serialized).not.toContain(roomKey);
      }
      expect(call!.length).toBe(4);

      // round trip
      const decrypted = new TextDecoder().decode(
        await decryptData(iv, encryptedBuffer, roomKey),
      );
      const data = JSON.parse(decrypted);
      expect(data.type).toBe(WS_SUBTYPES.UPDATE);
      expect(data.payload.elements).toHaveLength(1);
      expect(data.payload.elements[0].link).toBe(
        `https://example.test/${SECRET}`,
      );
    });

    it("cursor/idle (volatile) broadcasts are encrypted too, including the username", async () => {
      const { portal, emit } = setup();

      await portal.broadcastMouseLocation({
        pointer: { x: 1, y: 2, tool: "pointer" },
        button: "up",
      });
      await portal.broadcastIdleChange("active" as never);

      const volatileCalls = emit.mock.calls.filter(
        (c) => c[0] === WS_EVENTS.SERVER_VOLATILE,
      );
      expect(volatileCalls).toHaveLength(2);

      for (const [, , buffer, iv] of volatileCalls) {
        expect(latin1(buffer)).not.toContain(SECRET_USERNAME);
        const data = JSON.parse(
          new TextDecoder().decode(await decryptData(iv, buffer, roomKey)),
        );
        expect(data.payload.username).toBe(SECRET_USERNAME);
      }
    });

    it("the same plaintext never encrypts to the same ciphertext (fresh IV)", async () => {
      const { portal, emit } = setup();
      const elements = createSecretElements();
      await portal.broadcastScene(WS_SUBTYPES.INIT, elements, true);
      await portal.broadcastScene(WS_SUBTYPES.INIT, elements, true);
      const [a, b] = emit.mock.calls.filter((c) => c[0] === WS_EVENTS.SERVER);
      expect(latin1(a[3])).not.toBe(latin1(b[3]));
      expect(latin1(a[2])).not.toBe(latin1(b[2]));
    });

    it("fails to decrypt with a different key and with tampered ciphertext (AES-GCM)", async () => {
      const { portal, emit } = setup();
      await portal.broadcastScene(
        WS_SUBTYPES.UPDATE,
        createSecretElements(),
        false,
      );
      const [, , buffer, iv] = emit.mock.calls.find(
        (c) => c[0] === WS_EVENTS.SERVER,
      )!;

      const otherKey = await generateEncryptionKey();
      await expect(decryptData(iv, buffer, otherKey)).rejects.toThrow();

      const tampered = new Uint8Array(buffer.slice(0));
      tampered[0] ^= 0xff;
      await expect(decryptData(iv, tampered, roomKey)).rejects.toThrow();
    });

    it("does not emit anything until the socket is initialized", async () => {
      const { portal, emit } = setup();
      portal.socketInitialized = false;
      await portal.broadcastScene(
        WS_SUBTYPES.UPDATE,
        createSecretElements(),
        false,
      );
      expect(emit).not.toHaveBeenCalled();
    });

    it("close() forgets the room key", () => {
      const { portal } = setup();
      expect(portal.roomKey).toBe(roomKey);
      portal.close();
      expect(portal.roomKey).toBeNull();
      expect(portal.roomId).toBeNull();
      expect(portal.socket).toBeNull();
    });
  });

  describe("Firebase scene persistence", () => {
    const appState = { selectedElementIds: {} } as unknown as AppState;

    const makePortal = () => {
      const { socket } = makeFakeSocket();
      const portal = new Portal({} as TCollabClass);
      portal.open(socket, "room-id-1", roomKey);
      portal.socketInitialized = true;
      return { portal, socket };
    };

    it("stores only {sceneVersion, ciphertext, iv} and round-trips through loadFromFirebase", async () => {
      const { portal, socket } = makePortal();
      const elements = getSyncableElements(createSecretElements());

      await saveToFirebase(portal, elements, appState);

      const stored = fb.docs.get("scenes/room-id-1")!;
      expect(stored).toBeDefined();
      expect(Object.keys(stored).sort()).toEqual([
        "ciphertext",
        "iv",
        "sceneVersion",
      ]);
      const ciphertext = (
        stored.ciphertext as { toUint8Array(): Uint8Array }
      ).toUint8Array();
      expect(latin1(ciphertext)).not.toContain(SECRET);
      expect(latin1(ciphertext)).not.toContain(roomKey);
      expect(JSON.stringify(stored.sceneVersion)).not.toContain(SECRET);

      const loaded = await loadFromFirebase("room-id-1", roomKey, socket);
      expect(loaded).toHaveLength(1);
      expect(loaded![0].link).toBe(`https://example.test/${SECRET}`);
    });

    it("cannot be loaded with the wrong key", async () => {
      const { portal, socket } = makePortal();
      await saveToFirebase(
        portal,
        getSyncableElements(createSecretElements()),
        appState,
      );

      const wrongKey = await generateEncryptionKey();
      await expect(
        loadFromFirebase("room-id-1", wrongKey, socket),
      ).rejects.toThrow();
    });
  });

  describe("file uploads", () => {
    const FILE_ID = "file-1" as FileId;
    const fileData: BinaryFileData = {
      id: FILE_ID,
      mimeType: "image/png",
      dataURL: `data:image/png;base64,${SECRET}` as DataURL,
      created: 1,
    };

    it("encodeFilesForUpload output contains no plaintext and decrypts back with the key", async () => {
      const [processed] = await encodeFilesForUpload({
        files: new Map([[FILE_ID, fileData]]),
        maxBytes: 4 * 1024 * 1024,
        encryptionKey: roomKey,
      });

      expect(processed.id).toBe(FILE_ID);
      expect(latin1(processed.buffer)).not.toContain(SECRET);
      expect(latin1(processed.buffer)).not.toContain("image/png");

      const { data, metadata } = await decompressData<{
        id: string;
        mimeType: string;
      }>(processed.buffer, { decryptionKey: roomKey });
      expect(new TextDecoder().decode(data)).toBe(fileData.dataURL);
      expect(metadata.mimeType).toBe("image/png");

      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        await expect(
          decompressData(processed.buffer, {
            decryptionKey: await generateEncryptionKey(),
          }),
        ).rejects.toThrow();
      } finally {
        consoleError.mockRestore();
      }
    });

    it("saveFilesToFirebase uploads exactly the (encrypted) buffers it is given", async () => {
      const files = await encodeFilesForUpload({
        files: new Map([[FILE_ID, fileData]]),
        maxBytes: 4 * 1024 * 1024,
        encryptionKey: roomKey,
      });
      const { savedFiles, erroredFiles } = await saveFilesToFirebase({
        prefix: "/files/rooms/room-id-1",
        files,
      });
      expect(savedFiles).toEqual([FILE_ID]);
      expect(erroredFiles).toEqual([]);
      expect(fb.uploads).toHaveLength(1);
      expect(fb.uploads[0].path).toBe(`/files/rooms/room-id-1/${FILE_ID}`);
      expect(latin1(fb.uploads[0].data)).not.toContain(SECRET);
      expect(fb.uploads[0].path).not.toContain(roomKey);
    });

    it("loadFilesFromFirebase decrypts what was uploaded (round trip over fetch)", async () => {
      const files = await encodeFilesForUpload({
        files: new Map([[FILE_ID, fileData]]),
        maxBytes: 4 * 1024 * 1024,
        encryptionKey: roomKey,
      });
      const fetchMock = vi.fn(async (url: string) => {
        // the key must never be part of the request
        expect(url).not.toContain(roomKey);
        return new Response(new Uint8Array(files[0].buffer), { status: 200 });
      });
      vi.stubGlobal("fetch", fetchMock);
      try {
        const { loadedFiles, erroredFiles } = await loadFilesFromFirebase(
          "files/rooms/room-id-1",
          roomKey,
          [FILE_ID],
        );
        expect(erroredFiles.size).toBe(0);
        expect(loadedFiles).toHaveLength(1);
        expect(loadedFiles[0].dataURL).toBe(fileData.dataURL);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it("loadFilesFromFirebase reports a file as errored when the key is wrong", async () => {
      const files = await encodeFilesForUpload({
        files: new Map([[FILE_ID, fileData]]),
        maxBytes: 4 * 1024 * 1024,
        encryptionKey: roomKey,
      });
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => new Response(new Uint8Array(files[0].buffer))),
      );
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        const { loadedFiles, erroredFiles } = await loadFilesFromFirebase(
          "files/rooms/room-id-1",
          await generateEncryptionKey(),
          [FILE_ID],
        );
        expect(loadedFiles).toHaveLength(0);
        expect(erroredFiles.has(FILE_ID)).toBe(true);
      } finally {
        consoleError.mockRestore();
        vi.unstubAllGlobals();
      }
    });
  });

  describe("shareable links (exportToBackend / importFromBackend)", () => {
    it("uploads only ciphertext, keeps the key in the URL hash, and imports back", async () => {
      const elements = createSecretElements();
      let postedBody: ArrayBuffer | undefined;
      let postedUrl: string | undefined;

      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init?: RequestInit) => {
          postedUrl = url;
          postedBody = init?.body as ArrayBuffer;
          return new Response(JSON.stringify({ id: "share-id-1" }));
        }),
      );

      try {
        const result = await exportToBackend(elements, {}, {});
        expect(result.errorMessage).toBeNull();
        const link = new URL(result.url!);

        // key lives only in the fragment (never sent to a server)
        const match = link.hash.match(/^#json=share-id-1,([a-zA-Z0-9_-]{22})$/);
        expect(match).not.toBeNull();
        const shareKey = match![1];
        expect(link.search).not.toContain(shareKey);
        expect(link.pathname).not.toContain(shareKey);

        // the request carries neither the key nor the plaintext
        expect(String(postedUrl)).not.toContain(shareKey);
        expect(postedBody).toBeDefined();
        expect(latin1(postedBody!)).not.toContain(SECRET);
        expect(latin1(postedBody!)).not.toContain(shareKey);
        expect(latin1(postedBody!)).not.toContain("rectangle");

        // import with the key from the hash restores the scene
        vi.stubGlobal(
          "fetch",
          vi.fn(async () => new Response(toBytes(postedBody!) as BodyInit)),
        );
        const imported = await importFromBackend("share-id-1", shareKey);
        expect(imported.elements).toHaveLength(1);
        expect((imported.elements as any)[0].link).toBe(
          `https://example.test/${SECRET}`,
        );

        // wrong key: never yields plaintext. NOTE (unchanged upstream
        // behavior, ported line-for-line): the legacy-format fallback in
        // `importFromBackend` is returned un-awaited from the inner catch, so
        // its rejection escapes the outer try/catch and the promise rejects
        // instead of alert()ing + resolving `{}`.
        const consoleWarn = vi
          .spyOn(console, "warn")
          .mockImplementation(() => {});
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        try {
          await expect(
            importFromBackend("share-id-1", await generateEncryptionKey()),
          ).rejects.toThrow();
        } finally {
          consoleWarn.mockRestore();
          consoleError.mockRestore();
        }
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("socket id typing sanity", () => {
    it("SocketId is a plain string brand", () => {
      const id = "abc" as SocketId;
      expect(typeof id).toBe("string");
    });
  });
});
