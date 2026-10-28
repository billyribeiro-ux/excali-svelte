<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";

  import TTDDialog from "./TTDDialog.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ttdProps,
    app = {},
    initialAppState = {},
    onSetAppState,
  }: {
    ttdProps: Record<string, unknown>;
    app?: Record<string, unknown>;
    initialAppState?: Record<string, unknown>;
    onSetAppState?: (update: Record<string, unknown>) => void;
  } = $props();

  /* svelte-ignore state_referenced_locally */
  // reactive stand-in for the editor's app state, so that `setAppState` calls
  // (e.g. tab switches) re-render the dialog like the real editor does
  const appState = $state<Record<string, any>>({
    theme: "light",
    openDialog: { name: "ttd", tab: "mermaid" },
    ...initialAppState,
  });

  /* svelte-ignore state_referenced_locally */
  const editorApp = {
    ownerDocument: document,
    ownerWindow: window,
    id: "test-app",
    state: appState,
    onInsertElements: () => {},
    focusContainer: () => {},
    setOpenDialog: (dialog: unknown) => {
      appState.openDialog = dialog;
    },
    ...app,
  };

  const ctx = {
    app: editorApp,
    props: {},
    get appState() {
      return appState;
    },
    elements: [],
    editorInterface: { formFactor: "desktop" },
    container: document.body,
    api: null,
    actionManager: {
      isActionEnabled: () => true,
      executeAction: () => {},
    },
    setAppState: (update: Record<string, unknown>) => {
      Object.assign(appState, update);
      onSetAppState?.(update);
    },
  } as unknown as EditorContextValue;

  setEditorContext(ctx);
  setTunnels(createTunnels());
</script>

<TTDDialog {...(ttdProps as any)} />
