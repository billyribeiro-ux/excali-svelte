import { CaptureUpdateAction } from "@svelte-draw/element";

import { invariant } from "@svelte-draw/common";

import GoToCollaboratorPanel from "./panels/GoToCollaboratorPanel.svelte";
import { register } from "./register";

import type { Collaborator } from "../types";

export const actionGoToCollaborator = register<Collaborator>({
  name: "goToCollaborator",
  label: "Go to a collaborator",
  viewMode: true,
  trackEvent: { category: "collab" },
  perform: (_elements, appState, collaborator, app) => {
    invariant(
      collaborator,
      "actionGoToCollaborator: collaborator should be defined when actionGoToCollaborator is called",
    );

    if (
      !collaborator.socketId ||
      app.props.userToFollow?.socketId === collaborator.socketId ||
      collaborator.isCurrentUser
    ) {
      app.requestUnfollow();
      return {
        appState,
        captureUpdate: CaptureUpdateAction.EVENTUALLY,
      };
    }

    app.emitUserFollowIntent({
      userToFollow: {
        socketId: collaborator.socketId,
        username: collaborator.username || "",
      },
      action: "FOLLOW",
    });

    return {
      appState: {
        ...appState,
        // Close mobile menu
        openMenu: appState.openMenu === "canvas" ? null : appState.openMenu,
      },
      captureUpdate: CaptureUpdateAction.EVENTUALLY,
    };
  },
  PanelComponent: GoToCollaboratorPanel,
});
