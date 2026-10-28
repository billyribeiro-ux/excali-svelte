import { SHARE_TARGET_QUERY } from "./config.ts";

/** `share_target.params.files[0].accept` in the web manifest. */
const ACCEPTED_TYPES = ["application/vnd.excalidraw+json", "application/json"];
const ACCEPTED_EXTENSIONS = [".excalidraw", ".json"];
/** a shared drawing is JSON; refuse anything absurdly large */
export const MAX_SHARED_FILE_SIZE = 100 * 1024 ** 2;

export const isShareTargetRequest = (
  method: string,
  pathname: string,
  /** resolved action pathname, e.g. `/web-share-target` */
  actionPathname: string,
) => method === "POST" && pathname === actionPathname;

export const isAcceptedSharedFile = (file: {
  name: string;
  type: string;
  size: number;
}) => {
  if (file.size === 0 || file.size > MAX_SHARED_FILE_SIZE) return false;
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))
  );
};

/**
 * First acceptable file of the multipart field named `file`
 * (`share_target.params.files[0].name`), or `null`.
 */
export const pickSharedFile = (formData: FormData): File | null => {
  for (const value of formData.getAll("file")) {
    if (typeof value !== "string" && isAcceptedSharedFile(value)) {
      return value;
    }
  }
  return null;
};

/**
 * Content type to store: the editor reads the file back from the cache as a
 * `Blob` (the file name is lost), so make sure `.excalidraw` files, which
 * browsers often report with an empty type, keep a meaningful one.
 */
export const sharedFileContentType = (file: { name: string; type: string }) =>
  file.type ||
  (file.name.toLowerCase().endsWith(".excalidraw")
    ? "application/vnd.excalidraw+json"
    : "application/json");

/** Where to send the user after the POST: the shell, flagged when a file was stored. */
export const shareTargetRedirect = (
  /** resolved shell pathname, e.g. `/` */
  shellPathname: string,
  stored: boolean,
) => (stored ? `${shellPathname}?${SHARE_TARGET_QUERY}` : shellPathname);
