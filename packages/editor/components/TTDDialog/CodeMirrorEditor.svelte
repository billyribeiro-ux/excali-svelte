<script lang="ts" module>
  import type { Theme } from "@svelte-draw/element/types";

  import {
    Decoration,
    EditorView,
    keymap,
    lineNumbers,
    placeholder as cmPlaceholder,
    drawSelection,
  } from "@codemirror/view";
  import { Compartment, EditorState, type Extension } from "@codemirror/state";
  import {
    defaultKeymap,
    history,
    historyKeymap,
    redo,
  } from "@codemirror/commands";
  import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
  import { tags } from "@lezer/highlight";

  import { mermaidLite } from "./mermaid-lang-lite";

  export interface CodeMirrorEditorProps {
    value: string;
    onChange: (value: string) => void;
    onKeyboardSubmit?: () => void;
    placeholder?: string;
    theme: Theme;
    errorLine?: number | null;
  }

  // ---- Dark theme ----

  const darkTheme = EditorView.theme(
    {
      "&": {
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
      },
      ".cm-content": { caretColor: "#fff" },
      ".cm-cursor": { borderLeftColor: "#fff" },
      ".cm-gutters": {
        backgroundColor: "#1e1e1e",
        color: "#858585",
        border: "none",
      },
      ".cm-activeLineGutter": { backgroundColor: "#2a2a2a" },
      ".cm-activeLine": { backgroundColor: "#2a2a2a" },
      ".cm-errorLine": { backgroundColor: "rgba(255, 0, 0, 0.15)" },
    },
    { dark: true },
  );

  const darkHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: "#569cd6" },
    { tag: tags.string, color: "#ce9178" },
    { tag: tags.comment, color: "#6a9955" },
    { tag: tags.number, color: "#b5cea8" },
    { tag: tags.operator, color: "#d4d4d4" },
    { tag: tags.punctuation, color: "#d4d4d4" },
    { tag: tags.variableName, color: "#9cdcfe" },
    { tag: tags.bracket, color: "#ffd700" },
  ]);

  // ---- Light theme ----

  const lightTheme = EditorView.theme({
    "&": {
      backgroundColor: "#ffffff",
      color: "#1e1e1e",
    },
    ".cm-content": { caretColor: "#000" },
    ".cm-cursor": { borderLeftColor: "#000" },
    ".cm-gutters": {
      backgroundColor: "#fff",
      color: "#999",
      border: "none",
    },
    ".cm-activeLineGutter": { backgroundColor: "#e8e8e8" },
    ".cm-activeLine": { backgroundColor: "#e8e8e8" },
    ".cm-errorLine": { backgroundColor: "rgba(255, 0, 0, 0.1)" },
  });

  const lightHighlight = HighlightStyle.define([
    { tag: tags.keyword, color: "#0000ff" },
    { tag: tags.string, color: "#a31515" },
    { tag: tags.comment, color: "#008000" },
    { tag: tags.number, color: "#098658" },
    { tag: tags.operator, color: "#1e1e1e" },
    { tag: tags.punctuation, color: "#1e1e1e" },
    { tag: tags.variableName, color: "#001080" },
    { tag: tags.bracket, color: "#af00db" },
  ]);

  // ---- Error line decoration ----

  const errorLineDeco = Decoration.line({ class: "cm-errorLine" });

  const getErrorLineExtension = (
    errorLine: number | null | undefined,
    doc: { line(n: number): { from: number }; lines: number },
  ): Extension => {
    if (!errorLine || errorLine < 1 || errorLine > doc.lines) {
      return EditorView.decorations.of(Decoration.none);
    }
    const line = doc.line(errorLine);
    return EditorView.decorations.of(
      Decoration.set([errorLineDeco.range(line.from)]),
    );
  };

  // ---- Helpers ----

  const getThemeExtensions = (theme: Theme) => {
    if (theme === "dark") {
      return [darkTheme, syntaxHighlighting(darkHighlight)];
    }
    return [lightTheme, syntaxHighlighting(lightHighlight)];
  };
</script>

<script lang="ts">
  import { untrack } from "svelte";

  let {
    value,
    onChange,
    onKeyboardSubmit,
    placeholder,
    theme,
    errorLine,
  }: CodeMirrorEditorProps = $props();

  let view = $state.raw<EditorView | null>(null);
  const themeCompartment = new Compartment();
  const errorLineCompartment = new Compartment();

  const mount = (container: HTMLElement) => {
    // initial values are read untracked: later changes are applied to the
    // existing view by the effects below
    const initial = untrack(() => ({ value, theme, placeholder }));

    const editorView = new EditorView({
      state: EditorState.create({
        doc: initial.value,
        extensions: [
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                onKeyboardSubmit?.();
                return true;
              },
            },
            // historyKeymap binds Mod-Shift-z only on Mac; add it for all platforms
            { key: "Mod-Shift-z", run: redo, preventDefault: true },
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }
          }),
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          lineNumbers(),
          EditorView.lineWrapping,
          themeCompartment.of(getThemeExtensions(initial.theme)),
          errorLineCompartment.of([]),
          mermaidLite(),
          drawSelection({ drawRangeCursor: true }),
          ...(initial.placeholder ? [cmPlaceholder(initial.placeholder)] : []),
        ],
      }),
      parent: container,
    });

    view = editorView;
    editorView.focus();

    return () => {
      editorView.destroy();
      view = null;
    };
  };

  // Swap theme dynamically via compartment
  $effect(() => {
    const currentTheme = theme;
    view?.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtensions(currentTheme)),
    });
  });

  // Update error line highlight
  $effect(() => {
    const line = errorLine;
    if (view) {
      view.dispatch({
        effects: errorLineCompartment.reconfigure(
          getErrorLineExtension(line, view.state.doc),
        ),
      });
    }
  });

  // Sync external value changes into EditorView
  $effect(() => {
    const nextValue = value;
    if (!view) {
      return;
    }
    const currentDoc = view.state.doc.toString();
    if (nextValue !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: nextValue },
      });
    }
  });
</script>

<div
  {@attach mount}
  class="ttd-dialog-input ttd-dialog-input--codemirror"
></div>
