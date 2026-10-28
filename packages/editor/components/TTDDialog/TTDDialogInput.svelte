<script lang="ts">
  import { KEYS } from "@svelte-draw/common";

  import { getEditorContext } from "../../ui/editorContext";
  import Spinner from "../Spinner.svelte";

  import type { Component } from "svelte";
  import type { CodeMirrorEditorProps } from "./CodeMirrorEditor.svelte";

  interface Props {
    input: string;
    placeholder: string;
    onChange: (value: string) => void;
    onKeyboardSubmit?: () => void;
    errorLine?: number | null;
  }

  type EditorState =
    | { type: "loading" }
    | { type: "ready"; component: Component<CodeMirrorEditorProps> }
    | { type: "fallback" };

  const SPINNER_DELAY_MS = 300;

  let { input, placeholder, onChange, onKeyboardSubmit, errorLine }: Props =
    $props();

  const editor = getEditorContext();

  let editorState = $state.raw<EditorState>({ type: "loading" });
  let showSpinner = $state(false);

  const theme = $derived(editor.appState.theme);

  // Lazy-load CodeMirror editor
  $effect(() => {
    let cancelled = false;

    const spinnerTimer = setTimeout(() => {
      if (!cancelled) {
        showSpinner = true;
      }
    }, SPINNER_DELAY_MS);

    import("./CodeMirrorEditor.svelte")
      .then((mod) => {
        if (!cancelled) {
          editorState = { type: "ready", component: mod.default };
        }
      })
      .catch(() => {
        if (!cancelled) {
          editorState = { type: "fallback" };
        }
      })
      .finally(() => {
        clearTimeout(spinnerTimer);
      });

    return () => {
      cancelled = true;
      clearTimeout(spinnerTimer);
    };
  });

  // Keyboard shortcut for the textarea fallback
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!onKeyboardSubmit) {
      return;
    }
    if (event[KEYS.CTRL_OR_CMD] && event.key === KEYS.ENTER) {
      event.preventDefault();
      onKeyboardSubmit();
    }
  };

  const focusOnMount = (node: HTMLElement) => {
    node.focus();
  };
</script>

{#if editorState.type === "ready"}
  {@const CodeMirrorEditor = editorState.component}
  <CodeMirrorEditor
    value={input}
    {onChange}
    {onKeyboardSubmit}
    {placeholder}
    {theme}
    {errorLine}
  />
{:else if editorState.type === "fallback"}
  <textarea
    class="ttd-dialog-input"
    oninput={(event) => onChange(event.currentTarget.value)}
    onkeydown={handleKeyDown}
    value={input}
    {placeholder}
    {@attach focusOnMount}
  ></textarea>
{:else if showSpinner}
  <div class="ttd-dialog-input ttd-dialog-input--loading">
    <Spinner />
  </div>
{/if}
