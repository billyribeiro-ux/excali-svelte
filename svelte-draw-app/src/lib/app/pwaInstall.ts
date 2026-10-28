declare global {
  interface BeforeInstallPromptEventChoiceResult {
    outcome: "accepted" | "dismissed";
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener at module level as it may (?) need to be subscribed early
// to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
if (typeof window !== "undefined") {
  window.addEventListener(
    "beforeinstallprompt",
    (event: BeforeInstallPromptEvent) => {
      // prevent Chrome <= 67 from automatically showing the prompt
      event.preventDefault();
      // cache for later use
      pwaEvent = event;
    },
  );
}

export const getPWAInstallEvent = () => pwaEvent;
export const clearPWAInstallEvent = () => {
  pwaEvent = null;
};
