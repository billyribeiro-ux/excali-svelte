import { Blob as NodeBlob } from "node:buffer";

import { SHARE_TARGET_CACHE, SHARE_TARGET_KEY } from "./config.ts";
import { handleShareTarget } from "./share-target-handler.ts";

const setup = (formData: FormData | Error) => {
  const stored = new Map<string, { type: string | null; blob: Blob }>();
  const opened: string[] = [];
  const deps = {
    caches: {
      open: async (name: string) => {
        opened.push(name);
        return {
          put: async (key: string, response: Response) => {
            stored.set(key, {
              type: response.headers.get("content-type"),
              blob: await response.blob(),
            });
          },
        } as unknown as Cache;
      },
    },
    redirect: (url: string, status: number) =>
      ({ url, status }) as unknown as Response,
    shellPathname: "/",
    log: vi.fn(),
  };
  const request = {
    formData: async () => {
      if (formData instanceof Error) throw formData;
      return formData;
    },
  };
  return { stored, opened, deps, request };
};

describe("handleShareTarget", () => {
  it("stores the shared drawing where the editor reads it and redirects", async () => {
    // jsdom's File is not a Node Blob (`new Response(file)` would stringify
    // it); a service worker has native Files, which a named Node Blob mirrors
    const shared = Object.assign(new NodeBlob(['{"type":"excalidraw"}']), {
      name: "d.excalidraw",
    });
    const formData = { getAll: () => [shared] } as unknown as FormData;
    const { stored, opened, deps, request } = setup(formData);

    const response = (await handleShareTarget(request, deps)) as unknown as {
      url: string;
      status: number;
    };

    expect(opened).toEqual([SHARE_TARGET_CACHE]);
    expect(SHARE_TARGET_CACHE).toBe("web-share-target");
    expect(SHARE_TARGET_KEY).toBe("shared-file");
    const entry = stored.get(SHARE_TARGET_KEY)!;
    expect(entry.type).toBe("application/vnd.excalidraw+json");
    expect(entry.blob.size).toBe('{"type":"excalidraw"}'.length);
    expect(response).toEqual({ url: "/?web-share-target", status: 303 });
  });

  it("redirects to the plain shell and stores nothing without a usable file", async () => {
    const formData = new FormData();
    formData.append("file", new File(["x"], "pic.png", { type: "image/png" }));
    const { stored, opened, deps, request } = setup(formData);

    const response = await handleShareTarget(request, deps);

    expect(opened).toEqual([]);
    expect(stored.size).toBe(0);
    expect(response).toEqual({ url: "/", status: 303 });
  });

  it("does not fail the navigation when parsing throws, and logs it", async () => {
    const { deps, request } = setup(new Error("bad multipart"));

    const response = await handleShareTarget(request, deps);

    expect(response).toEqual({ url: "/", status: 303 });
    expect(deps.log).toHaveBeenCalledOnce();
  });
});
