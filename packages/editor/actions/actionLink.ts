import { getNonDeletedElements } from "@svelte-draw/element";

import { KEYS } from "@svelte-draw/common";

import { CaptureUpdateAction } from "@svelte-draw/element";

import { getContextMenuLabel } from "../components/hyperlink/Hyperlink";
import { LinkIcon } from "../components/icons";
import { getSelectedElements } from "../scene";

import LinkPanel from "./panels/LinkPanel.svelte";

import { register } from "./register";

export const actionLink = register({
  name: "hyperlink",
  label: (elements, appState) =>
    getContextMenuLabel(getNonDeletedElements(elements), appState),
  icon: LinkIcon,
  perform: (elements, appState) => {
    if (appState.showHyperlinkPopup === "editor") {
      return false;
    }

    return {
      elements,
      appState: {
        ...appState,
        showHyperlinkPopup: "editor",
        openMenu: null,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };
  },
  trackEvent: { category: "hyperlink", action: "click" },
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.K,
  predicate: (elements, appState) => {
    const selectedElements = getSelectedElements(elements, appState);
    return selectedElements.length === 1;
  },
  PanelComponent: LinkPanel,
});
