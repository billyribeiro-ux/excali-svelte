import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Harness from "../components/TTDDialog/TTDDialogHarness.test.svelte";

import { mockMermaidToExcalidraw } from "./helpers/mocks";

// Mock CodeMirror deps so the dynamic import of CodeMirrorEditor fails,
// causing TTDDialogInput to fall back to <textarea> in tests.
vi.mock("@codemirror/view", () => ({}));
vi.mock("@codemirror/state", () => ({}));
vi.mock("@codemirror/language", () => ({}));
vi.mock("@lezer/highlight", () => ({}));

// `mermaid-to-excalidraw` is loaded by the dialog through a plain dynamic
// import, so the regular module mock from `./helpers/mocks` is all it needs.
mockMermaidToExcalidraw({
  parseMermaidToExcalidraw: async (definition) => {
    const firstLine = definition.split("\n")[0];
    return new Promise((resolve, reject) => {
      if (firstLine === "flowchart TD") {
        resolve({
          elements: [
            {
              id: "Start",
              type: "rectangle",
              groupIds: [],
              x: 0,
              y: 0,
              width: 69.703125,
              height: 44,
              strokeWidth: 2,
              label: {
                groupIds: [],
                text: "Start",
                fontSize: 20,
              },
              link: null,
            },
            {
              id: "Stop",
              type: "rectangle",
              groupIds: [],
              x: 2.7109375,
              y: 94,
              width: 64.28125,
              height: 44,
              strokeWidth: 2,
              label: {
                groupIds: [],
                text: "Stop",
                fontSize: 20,
              },
              link: null,
            },
            {
              id: "Start_Stop",
              type: "arrow",
              groupIds: [],
              x: 34.852,
              y: 44,
              strokeWidth: 2,
              points: [
                [0, 0],
                [0, 50],
              ],
              roundness: {
                type: 2,
              },
              start: {
                id: "Start",
              },
              end: {
                id: "Stop",
              },
            },
          ],
        });
      } else if (firstLine === "sequenceDiagram") {
        reject(
          new TypeError(
            "Failed to fetch dynamically imported module: http://localhost/assets/sequenceDiagram.js",
          ),
        );
      } else {
        reject(new Error("ERROR"));
      }
    });
  },
});


const getInput = async () =>
  (await waitFor(() => {
    const el = document.querySelector<HTMLTextAreaElement>(
      "textarea.ttd-dialog-input",
    );
    expect(el).not.toBeNull();
    return el;
  })) as HTMLTextAreaElement;

const typeInto = (textarea: HTMLTextAreaElement, value: string) =>
  fireEvent.input(textarea, { target: { value } });

describe("Test <MermaidToExcalidraw/>", () => {
  beforeEach(() => {
    localStorage.clear();
    render(Harness, {
      ttdProps: { __fallback: true },
      initialAppState: { openDialog: { name: "ttd", tab: "mermaid" } },
    });
  });

  it("should open mermaid popup when active tool is mermaid", async () => {
    const dialog = document.querySelector(".ttd-dialog")!;
    await waitFor(() => expect(dialog.querySelector("canvas")).not.toBeNull());

    // structure of the former DOM snapshot (Radix ids/attributes aside)
    expect(dialog).toHaveClass("Modal", "Dialog", "ttd-dialog");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.querySelector(".Modal__content")).toHaveStyle(
      "--max-width: 1520px",
    );
    expect(
      dialog.querySelector(".ttd-dialog-tabs-root > .dialog-mermaid-title"),
    ).toHaveTextContent("Mermaid to svelte-draw");
    const tabpanel = dialog.querySelector(".ttd-dialog-content")!;
    expect(tabpanel).toHaveAttribute("role", "tabpanel");
    expect(
      [...tabpanel.querySelectorAll(".ttd-dialog-desc a")].map((a) => [
        a.textContent,
        a.getAttribute("href"),
        a.getAttribute("target"),
        a.getAttribute("rel"),
      ]),
    ).toEqual([
      ["Flowchart", "https://mermaid.js.org/syntax/flowchart.html", "_blank", "noreferrer"],
      ["Sequence", "https://mermaid.js.org/syntax/sequenceDiagram.html", "_blank", "noreferrer"],
      ["Class", "https://mermaid.js.org/syntax/classDiagram.html", "_blank", "noreferrer"],
      [
        "Entity Relationship",
        "https://mermaid.js.org/syntax/entityRelationshipDiagram.html",
        "_blank",
        "noreferrer",
      ],
    ]);
    expect(tabpanel.querySelector(".ttd-dialog-desc")?.textContent).toBe(
      "Currently only Flowchart, Sequence, Class, and Entity Relationship Diagrams are supported. The other types will be rendered as image in svelte-draw.",
    );
    expect(tabpanel.querySelectorAll(".ttd-dialog-panels > .ttd-dialog-panel")).toHaveLength(2);
    expect(
      tabpanel.querySelector(
        ".ttd-dialog-output-canvas-container .ttd-dialog-output-canvas-content canvas",
      ),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: /Insert/ })).toHaveClass(
      "excalidraw-button",
      "ttd-dialog-panel-button",
    );
    expect(
      [...tabpanel.querySelectorAll(".ttd-dialog-submit-shortcut__key")].map(
        (el) => el.textContent,
      ),
    ).toEqual([expect.stringMatching(/Ctrl|⌘/), "Enter"]);
  });

  it("should show error in preview when mermaid library throws error", async () => {
    const dialog = document.querySelector(".ttd-dialog")!;

    expect(dialog).not.toBeNull();

    const editor = await getInput();

    expect(dialog.querySelector('[data-testid="mermaid-error"]')).toBeNull();

    expect(editor.value).toBe(
      "flowchart TD\n A[Christmas] -->|Get money| B(Go shopping)\n B --> C{Let me think}\n C -->|One| D[Laptop]\n C -->|Two| E[iPhone]\n C -->|Three| F[Car]",
    );

    await typeInto(editor, "flowchart TD1");

    expect((await getInput()).value).toBe("flowchart TD1");
    expect(dialog.querySelector('[data-testid="mermaid-error"]')).toBeNull();

    // the lib rejects with a syntax error -> shown as a parse error (not a
    // load failure)
    await waitFor(() =>
      expect(
        dialog.querySelector('[data-testid="ttd-dialog-output-error"]'),
      ).not.toBeNull(),
    );
    expect(
      dialog.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
    ).toBeNull();
  });

  it("should show a load error when a diagram chunk fails to load", async () => {
    const dialog = document.querySelector(".ttd-dialog")!;
    const editor = await getInput();

    await typeInto(editor, "sequenceDiagram");

    await waitFor(() =>
      expect(
        dialog.querySelector('[data-testid="ttd-dialog-output-load-error"]'),
      ).not.toBeNull(),
    );
    expect(
      dialog.querySelector('[data-testid="ttd-dialog-output-error"]'),
    ).toBeNull();
  });
});
