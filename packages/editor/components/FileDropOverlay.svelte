<script lang="ts" module>
  type FileDropState = {
    shiftKey: boolean;
    // "unknown": no MIME type, which is what OS-dragged .excalidraw and
    // .excalidrawlib files both report, so it can be either until dropped
    kind: "scene" | "library" | "unknown";
  };

  // splits `Hold <shift>Shift</shift> to ...` into plain / <kbd> parts
  const SHIFT_TAG = /<shift>(.*?)<\/shift>/;
  const splitShiftHint = (hint: string) => {
    const match = SHIFT_TAG.exec(hint);
    if (!match) {
      return { before: hint, shift: null, after: "" };
    }
    return {
      before: hint.slice(0, match.index),
      shift: match[1],
      after: hint.slice(match.index + match[0].length),
    };
  };
</script>

<script lang="ts">
  import { KEYS, MIME_TYPES } from "@svelte-draw/common";

  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import "./FileDropOverlay.scss";

  const ctx = getEditorContext();

  let dragState = $state.raw<FileDropState | null>(null);

  $effect(() => {
    const { app, container } = ctx;
    if (!container) {
      return;
    }

    let dragDepth = 0;
    const reset = () => {
      dragDepth = 0;
      dragState = null;
    };
    const isFileDrag = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const update = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.items ?? []).filter(
        (item) => item.kind === "file",
      );
      // Filenames are protected until drop, so .excalidraw.png/.svg exports
      // cannot be distinguished here. Keep the canvas visible for all images.
      if (files.some((file) => file.type.startsWith("image/"))) {
        dragState = null;
        return;
      }

      const type = files[0]?.type;
      const kind: FileDropState["kind"] =
        type === MIME_TYPES.excalidrawlib
          ? "library"
          : type
          ? "scene"
          : "unknown";

      const previous = dragState;
      dragState =
        previous?.shiftKey === event.shiftKey && previous.kind === kind
          ? previous
          : { shiftKey: event.shiftKey, kind };
    };
    const onDragEnter = (event: DragEvent) => {
      if (isFileDrag(event)) {
        dragDepth++;
        update(event);
      }
    };
    const onDragOver = (event: DragEvent) => {
      // App's own dragover listener already calls preventDefault()
      if (isFileDrag(event)) {
        // Shift defaults the drag to "move" (and its cursor), but we only
        // ever copy the file in
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "copy";
        }
        dragDepth = Math.max(1, dragDepth);
        update(event);
      }
    };
    const onDragLeave = () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) {
        reset();
      }
    };
    const onKeyChange = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        reset();
      } else if (event.key === "Shift") {
        const previous = dragState;
        dragState = previous
          ? { ...previous, shiftKey: event.shiftKey }
          : previous;
      }
    };

    container.addEventListener("dragenter", onDragEnter);
    container.addEventListener("dragover", onDragOver);
    container.addEventListener("dragleave", onDragLeave);
    app.ownerDocument.addEventListener("drop", reset, true);
    app.ownerDocument.addEventListener("dragend", reset, true);
    app.ownerDocument.addEventListener("keydown", onKeyChange, true);
    app.ownerDocument.addEventListener("keyup", onKeyChange, true);
    app.ownerWindow.addEventListener("blur", reset);

    return () => {
      container.removeEventListener("dragenter", onDragEnter);
      container.removeEventListener("dragover", onDragOver);
      container.removeEventListener("dragleave", onDragLeave);
      app.ownerDocument.removeEventListener("drop", reset, true);
      app.ownerDocument.removeEventListener("dragend", reset, true);
      app.ownerDocument.removeEventListener("keydown", onKeyChange, true);
      app.ownerDocument.removeEventListener("keyup", onKeyChange, true);
      app.ownerWindow.removeEventListener("blur", reset);
    };
  });

  const keepsContent = $derived(
    !!dragState && (dragState.shiftKey || dragState.kind === "library"),
  );
  const replaceHint = $derived(splitShiftHint(t("fileDrop.replaceHint")));
</script>

{#if dragState}
  <div class={["file-drop-overlay", { "file-drop-overlay--keep": keepsContent }]}>
    <div class="file-drop-overlay__card">
      <div role="status" aria-live="polite" aria-atomic="true">
        <div class="file-drop-overlay__title">
          {t(
            dragState.kind === "library"
              ? "fileDrop.importLibrary"
              : dragState.shiftKey
              ? "fileDrop.add"
              : "fileDrop.replace",
          )}
        </div>
        <div class="file-drop-overlay__hint">
          {#if keepsContent}
            {t("fileDrop.keepHint")}
          {:else}
            {replaceHint.before}{#if replaceHint.shift !== null}<kbd
                >{replaceHint.shift}</kbd
              >{/if}{replaceHint.after}
          {/if}
        </div>
        {#if dragState.kind === "unknown"}
          <div
            class="file-drop-overlay__hint file-drop-overlay__hint--secondary"
          >
            ({t("fileDrop.libraryHint")})
          </div>
        {/if}
      </div>
      <div class="file-drop-overlay__illustration" aria-hidden="true">
        {#each ["back", "front"] as const as position (position)}
          <svg
            class="file-drop-overlay__file file-drop-overlay__file--{position}"
            viewBox="0 0 100 128"
            fill="none"
          >
            <path
              class="file-drop-overlay__paper"
              d="M16 3h43l28 28v81c0 7-4 12-12 12H16c-8 0-12-5-12-12V15C4 7 8 3 16 3Z"
            />
            <path d="M59 3v20c0 6 3 8 9 8h19" />
            <path
              class="file-drop-overlay__lines"
              d="M24 61h43M24 77h43M24 93h26"
            />
            {#if position === "back"}
              <path
                class="file-drop-overlay__cross"
                d="M18 44l24 24M42 44L18 68"
              />
            {/if}
          </svg>
        {/each}
      </div>
    </div>
  </div>
{/if}
