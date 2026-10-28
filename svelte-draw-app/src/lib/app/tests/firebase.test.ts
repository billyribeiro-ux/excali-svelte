import { describe, expect, it, vi } from "vitest";

import type { FileId } from "@svelte-draw/element/types";

import { saveFilesToFirebase } from "../data/firebase.ts";

vi.mock("../data/firebaseSDK.ts", () => {
  throw new TypeError(
    "Failed to fetch dynamically imported module: http://localhost/assets/firebaseSDK.js",
  );
});

describe("saveFilesToFirebase", () => {
  it("should reject when the Firebase SDK fails to load", async () => {
    await expect(
      saveFilesToFirebase({
        prefix: "/files/shareLinks/id",
        files: [{ id: "file" as FileId, buffer: new Uint8Array([1]) }],
      }),
    ).rejects.toThrow();
  });
});
