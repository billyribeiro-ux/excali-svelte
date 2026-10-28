/**
 * Optional "public library" integration. Both endpoints come from build-time
 * env vars and default to EMPTY, which hides the related UI (Browse libraries,
 * Publish library) and installs no library URL allow-list. There is
 * intentionally no built-in third-party default.
 *
 * - `VITE_APP_LIBRARY_URL`: site where users browse/install libraries
 * - `VITE_APP_LIBRARY_BACKEND`: base URL of the API accepting `POST /submit`
 *
 * These are read lazily (functions, not constants) so tests can stub the env.
 */

const read = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

export const getLibraryBrowseUrl = (): string =>
  read(import.meta.env.VITE_APP_LIBRARY_URL);

export const getLibraryPublishBackend = (): string =>
  read(import.meta.env.VITE_APP_LIBRARY_BACKEND).replace(/\/+$/, "");

/**
 * Default allow-list for installing a library from a URL
 * (`#addLibrary=<url>`): the configured library site's hostname only.
 */
export const getDefaultAllowedLibraryUrls = (): string[] => {
  const browseUrl = getLibraryBrowseUrl();
  if (!browseUrl) {
    return [];
  }
  try {
    return [new URL(browseUrl).hostname];
  } catch {
    console.error(
      "VITE_APP_LIBRARY_URL is not a valid URL; library URL installs are disabled.",
    );
    return [];
  }
};
