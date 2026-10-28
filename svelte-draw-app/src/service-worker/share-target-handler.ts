import { SHARE_TARGET_CACHE, SHARE_TARGET_KEY } from "./config.ts";
import {
  pickSharedFile,
  shareTargetRedirect,
  sharedFileContentType,
} from "./share-target.ts";

export interface ShareTargetDeps {
  /** `self.caches` */
  caches: Pick<CacheStorage, "open">;
  /** `Response.redirect`, injectable because it is not available everywhere */
  redirect: (url: string, status: number) => Response;
  /** resolved shell pathname, e.g. `/` */
  shellPathname: string;
  log?: (message: string, error: unknown) => void;
}

/**
 * Handle the POST of the Web Share Target API: store the shared drawing under
 * `web-share-target` / `shared-file` (where the editor's
 * `restoreFileFromShare` reads it) and 303-redirect to the shell, flagged with
 * `?web-share-target`. Never fails the navigation: without a usable file the
 * user is simply sent to the shell.
 */
export async function handleShareTarget(
  request: { formData(): Promise<FormData> },
  deps: ShareTargetDeps,
): Promise<Response> {
  let stored = false;
  try {
    const file = pickSharedFile(await request.formData());
    if (file) {
      const cache = await deps.caches.open(SHARE_TARGET_CACHE);
      await cache.put(
        SHARE_TARGET_KEY,
        new Response(file, {
          headers: { "content-type": sharedFileContentType(file) },
        }),
      );
      stored = true;
    }
  } catch (error) {
    deps.log?.("could not store the shared file", error);
  }
  return deps.redirect(shareTargetRedirect(deps.shellPathname, stored), 303);
}
