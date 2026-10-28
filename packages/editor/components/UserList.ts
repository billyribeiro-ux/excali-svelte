import type { Collaborator, SocketId } from "../types";

export type GoToCollaboratorComponentProps = {
  socketId: SocketId;
  collaborator: Collaborator;
  withName: boolean;
  isBeingFollowed: boolean;
};

export type UserListUserObject = Pick<
  Collaborator,
  | "avatarUrl"
  | "id"
  | "socketId"
  | "username"
  | "isInCall"
  | "isSpeaking"
  | "isMuted"
  | "isCurrentUser"
>;
