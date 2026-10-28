import { appAtomStore, appLangCodeAtom } from "../app-atoms.ts";

import { languageDetector } from "./language-detector.ts";

export { appLangCodeAtom };

export const getAppLangCode = () => appAtomStore.get(appLangCodeAtom);

export const setAppLangCode = (langCode: string) => {
  appAtomStore.set(appLangCodeAtom, langCode);
};

/**
 * Replaces the React `useAppLangCode()` effect: persists the language through
 * the detector now and whenever `appLangCodeAtom` changes (including changes
 * made directly on the atom, e.g. by the language list). Call it once from
 * `App.svelte` (e.g. inside `onMount`/`$effect`) and invoke the returned
 * function to stop persisting.
 */
export const startAppLangCodePersistence = () => {
  languageDetector.cacheUserLanguage(getAppLangCode());
  return appAtomStore.sub(appLangCodeAtom, () => {
    languageDetector.cacheUserLanguage(getAppLangCode());
  });
};
