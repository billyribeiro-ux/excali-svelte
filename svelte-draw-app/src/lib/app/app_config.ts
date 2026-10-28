/**
 * Runtime/build-time configuration of the optional, backend-dependent
 * features. Every value comes from a `VITE_APP_*` variable (see
 * `svelte-draw-app/.env.example`) and defaults to EMPTY, which switches the
 * related UI off. There is deliberately no fallback to any third party's
 * server: an unset endpoint means "not configured".
 */

const read = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

/** shareable-link backend: GET `${url}${id}` / POST `url` */
export const BACKEND_V2_GET_URL = read(import.meta.env.VITE_APP_BACKEND_V2_GET_URL);
export const BACKEND_V2_POST_URL = read(import.meta.env.VITE_APP_BACKEND_V2_POST_URL);

/** socket.io server used for live collaboration */
export const WS_SERVER_URL = read(import.meta.env.VITE_APP_WS_SERVER_URL);

/** Sentry DSN; error reporting is off when empty */
export const SENTRY_DSN = read(import.meta.env.VITE_APP_SENTRY_DSN);

/** diagram-to-code / text-to-diagram backend; AI features are off when empty */
export const AI_BACKEND_URL = read(import.meta.env.VITE_APP_AI_BACKEND);

/**
 * Firebase web-app config (JSON). Collaboration stores scenes and image files
 * in Firestore/Storage, so it is only available when this parses to an object
 * with a `projectId`. Invalid JSON is reported loudly and treated as unset.
 */
const parseFirebaseConfig = (): Record<string, any> | null => {
  const raw = read(import.meta.env.VITE_APP_FIREBASE_CONFIG);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.projectId) {
      return parsed;
    }
    console.error(
      "VITE_APP_FIREBASE_CONFIG must be a JSON object containing `projectId`; collaboration is disabled.",
    );
  } catch (error: any) {
    console.error(
      "VITE_APP_FIREBASE_CONFIG is not valid JSON; collaboration is disabled.",
      error,
    );
  }
  return null;
};

export const FIREBASE_CONFIG = parseFirebaseConfig();

/** "Export to link" needs both the read and the write endpoint */
export const isShareLinkConfigured =
  !!BACKEND_V2_GET_URL && !!BACKEND_V2_POST_URL;

/** live collaboration needs the websocket server and the Firebase backend */
export const isCollabConfigured = !!WS_SERVER_URL && !!FIREBASE_CONFIG;

export const isAIConfigured = !!AI_BACKEND_URL;
