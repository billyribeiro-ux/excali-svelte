import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GoToCollaboratorPanel from "../actions/panels/GoToCollaboratorPanel.svelte";

import { createFakeEditor } from "./testing/fakeEditor.test.helpers.svelte";
import UserListHarness from "./UserListHarness.test.svelte";

import type { Collaborator, SocketId } from "../types";

const socketId = (id: string) => id as SocketId;

const controls = createRawSnippet((isMobile: () => boolean) => ({
  render: () =>
    `<button type="button">Spotlight me${isMobile() ? " (mobile)" : ""}</button>`,
}));

const makeEditor = () => {
  const updateData = vi.fn();
  const editor = createFakeEditor({
    actionManager: {
      getPanel: (name: string) =>
        name === "goToCollaborator"
          ? { action: {}, PanelComponent: GoToCollaboratorPanel, updateData }
          : null,
    },
  });
  return { ...editor, updateData };
};

const collaborator = (
  id: string,
  username: string,
  isCurrentUser: boolean,
  sockId = id,
): [SocketId, Collaborator] => [
  socketId(sockId),
  { id, socketId: socketId(sockId), username, isCurrentUser },
];

describe("UserList", () => {
  const originalResizeObserver = (global as any).ResizeObserver;

  beforeEach(() => {
    // Bits UI popovers measure their content when opened
    (global as any).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    (global as any).ResizeObserver = originalResizeObserver;
  });

  it("retains the local dropdown when the same account has multiple clients", async () => {
    const { ctx } = makeEditor();
    const { container } = render(UserListHarness, {
      ctx,
      collaborators: new Map([
        collaborator("user", "Ada", false, "other"),
        collaborator("user", "Ada", true, "current"),
      ]),
      userToFollow: null,
      currentUserControls: controls,
    });

    await waitFor(() => {
      expect(container.querySelectorAll(".UserList__pill")).toHaveLength(1);
    });

    const currentUserPill =
      container.querySelector<HTMLElement>(".UserList__pill");
    expect(currentUserPill).not.toBeNull();

    await fireEvent.click(currentUserPill!);

    await waitFor(() => {
      const dropdown = document.querySelector(".UserList__collaborators");
      const dropdownCollaborators = dropdown?.querySelectorAll(
        ".UserList__collaborator",
      );
      expect(dropdownCollaborators).toHaveLength(2);
      expect(
        dropdown?.querySelectorAll(".UserList__collaborator.is-current-user"),
      ).toHaveLength(1);
      expect(screen.getByText("Spotlight me")).toBeVisible();
    });
  });

  it("skips collaborators without a username", async () => {
    const { ctx } = makeEditor();
    const { container } = render(UserListHarness, {
      ctx,
      collaborators: new Map([
        collaborator("a", "", false),
        collaborator("me", "Me", true),
      ]),
      userToFollow: null,
    });

    await waitFor(() =>
      expect(container.querySelectorAll(".UserList__pill")).toHaveLength(1),
    );
    expect(container.querySelectorAll(".UserList__collaborator")).toHaveLength(
      1,
    );
  });

  it("renders every avatar and the controls inline in mobile mode", async () => {
    const { ctx } = makeEditor();
    const { container } = render(UserListHarness, {
      ctx,
      mobile: true,
      collaborators: new Map([
        collaborator("a", "Ada", false),
        collaborator("b", "Bob", false),
        collaborator("me", "Me", true),
      ]),
      userToFollow: socketId("b"),
      currentUserControls: controls,
    });

    await waitFor(() =>
      expect(container.querySelector(".UserList_mobile")).not.toBeNull(),
    );
    expect(
      container.querySelectorAll(
        ".UserList_mobile__avatars .UserList__collaborator",
      ),
    ).toHaveLength(3);
    expect(container.querySelector(".UserList__pill")).toBeNull();
    expect(container.querySelector(".UserList__menu-divider")).not.toBeNull();
    // the render function-style snippet receives `isMobile`
    expect(container).toHaveTextContent("Spotlight me (mobile)");
    // the followed user is marked
    expect(container.querySelector(".is-followed")).not.toBeNull();
  });

  it("lists everyone in the dropdown and filters them with the search field", async () => {
    const { ctx } = makeEditor();
    const names = ["Ada", "Bob", "Cy", "Di", "Ed", "Flo", "Gus"];
    const { container } = render(UserListHarness, {
      ctx,
      collaborators: new Map([
        ...names.map((name) => collaborator(name, name, false)),
        collaborator("me", "Mia", true),
      ]),
      userToFollow: null,
    });

    await waitFor(() =>
      expect(container.querySelector(".UserList__pill")).not.toBeNull(),
    );
    await fireEvent.click(container.querySelector(".UserList__pill")!);

    await waitFor(() => {
      expect(
        document.querySelectorAll(
          ".UserList__collaborators .UserList__collaborator",
        ),
      ).toHaveLength(8);
    });

    // 8 collaborators => the quick search is shown
    const search = document.querySelector<HTMLInputElement>(
      ".QuickSearch__input",
    )!;
    expect(search).not.toBeNull();

    await fireEvent.input(search, { target: { value: "gu" } });
    await waitFor(() => {
      const items = document.querySelectorAll(
        ".UserList__collaborators .UserList__collaborator",
      );
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent("Gus");
    });
  });
});
