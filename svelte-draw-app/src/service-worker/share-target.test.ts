import {
  MAX_SHARED_FILE_SIZE,
  isAcceptedSharedFile,
  isShareTargetRequest,
  pickSharedFile,
  shareTargetRedirect,
  sharedFileContentType,
} from "./share-target.ts";

const file = (name: string, type: string, body = "{}") =>
  new File([body], name, { type });

describe("isShareTargetRequest", () => {
  it("only matches POST to the action path", () => {
    expect(isShareTargetRequest("POST", "/web-share-target", "/web-share-target")).toBe(true);
    expect(isShareTargetRequest("GET", "/web-share-target", "/web-share-target")).toBe(false);
    expect(isShareTargetRequest("POST", "/other", "/web-share-target")).toBe(false);
  });
});

describe("pickSharedFile", () => {
  it("returns the first acceptable file from the `file` field", () => {
    const formData = new FormData();
    formData.append("file", file("notes.txt", "text/plain"));
    formData.append("other", file("x.excalidraw", ""));
    formData.append("file", file("a.excalidraw", ""));
    formData.append("file", file("b.json", "application/json"));
    expect(pickSharedFile(formData)?.name).toBe("a.excalidraw");
  });

  it("accepts by mime type or by extension, rejects the rest", () => {
    expect(isAcceptedSharedFile(file("x", "application/vnd.excalidraw+json"))).toBe(true);
    expect(isAcceptedSharedFile(file("x", "application/json"))).toBe(true);
    expect(isAcceptedSharedFile(file("X.EXCALIDRAW", ""))).toBe(true);
    expect(isAcceptedSharedFile(file("x.png", "image/png"))).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(isAcceptedSharedFile(file("a.excalidraw", "", ""))).toBe(false);
    expect(
      isAcceptedSharedFile({ name: "a.excalidraw", type: "", size: MAX_SHARED_FILE_SIZE + 1 }),
    ).toBe(false);
  });

  it("returns null when no file / only string values were posted", () => {
    const formData = new FormData();
    formData.append("file", "just text");
    expect(pickSharedFile(formData)).toBeNull();
    expect(pickSharedFile(new FormData())).toBeNull();
  });
});

describe("sharedFileContentType / shareTargetRedirect", () => {
  it("keeps a reported type and fills in the missing ones", () => {
    expect(sharedFileContentType({ name: "a", type: "application/json" })).toBe("application/json");
    expect(sharedFileContentType({ name: "a.excalidraw", type: "" })).toBe(
      "application/vnd.excalidraw+json",
    );
    expect(sharedFileContentType({ name: "a.json", type: "" })).toBe("application/json");
  });

  it("redirects to the shell, flagged only when a file was stored", () => {
    expect(shareTargetRedirect("/", true)).toBe("/?web-share-target");
    expect(shareTargetRedirect("/", false)).toBe("/");
    expect(shareTargetRedirect("/draw/", true)).toBe("/draw/?web-share-target");
  });
});
