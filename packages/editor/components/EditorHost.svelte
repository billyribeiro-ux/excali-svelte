<script lang="ts">
  import { onMount, untrack, flushSync as flushSvelte } from "svelte";
  import type { Snippet } from "svelte";

  import { deriveStylesPanelMode } from "@svelte-draw/common";

  import { createEditorBridge, setEditorContext } from "../ui/editorContext";

  import App from "./App";
  import EditorView from "./EditorView.svelte";

  import type { AppProps } from "../types";
  import type { RenderModel } from "./renderModel";

  type Props = {
    /** normalized props (see `SvelteDraw.svelte`) */
    appProps: AppProps;
    children?: Snippet;
  };

  let { appProps, children }: Props = $props();

  // The editor is constructed once, after the language is loaded (see
  // `SvelteDraw.svelte`); later prop changes reach it through `setProps`.
  const app = new App(untrack(() => appProps));
  const bridge = createEditorBridge(app);

  let model = $state.raw<RenderModel>(app.computeRenderModel());
  // bumped after every commit (see `subscribePostCommit`): the canvases paint
  // then, like React's `useEffect`, i.e. after `componentDidUpdate`
  let paintEpoch = $state(0);

  setEditorContext({
    get app() {
      return app;
    },
    get props() {
      return bridge.props.get();
    },
    get appState() {
      return bridge.state.get();
    },
    get elements() {
      return bridge.elements.get();
    },
    get actionManager() {
      return app.actionManager;
    },
    get editorInterface() {
      return bridge.editorInterface.get();
    },
    get stylesPanelMode() {
      return deriveStylesPanelMode(bridge.editorInterface.get());
    },
    get api() {
      return bridge.api.get();
    },
    get container() {
      return bridge.container.get();
    },
    setAppState: app.setAppState,
  });

  /**
   * Applies pending view updates to the DOM synchronously, so that
   * `componentDidUpdate` (and `flushSync` callers) observe the updated view.
   *
   * Svelte 5's `flushSync` must not run while Svelte itself is executing
   * effects — it does not throw there, it corrupts the batch in progress
   * (React merely warns and defers in the same situation). In that case the
   * running flush picks the update up on its own, so we skip ours. (E.g. a
   * focus trap focusing an element in an effect blurs the text editor, which
   * commits the editor from within that effect.)
   */
  const flushViewSync = () => {
    if ($effect.tracking()) {
      return;
    }
    flushSvelte();
  };

  /**
   * Runs where React would have committed the DOM: refresh the signals and the
   * render model, then apply them to the DOM.
   */
  const commitView = () => {
    bridge.sync();
    model = app.computeRenderModel();
    flushViewSync();
  };

  const unsubscribe = app.subscribeCommit(commitView);
  const unsubscribePaint = app.subscribePostCommit(() => {
    paintEpoch++;
    flushViewSync();
  });

  let isFirstProps = true;
  $effect(() => {
    const next = appProps;
    if (isFirstProps) {
      isFirstProps = false;
      return;
    }
    untrack(() => app.setProps(next));
  });

  onMount(() => {
    app.mount();
    return () => {
      unsubscribe();
      unsubscribePaint();
      app.unmount();
      app.excalidrawContainerRef.current = null;
    };
  });
</script>

<EditorView {app} {model} {paintEpoch} {children} />
