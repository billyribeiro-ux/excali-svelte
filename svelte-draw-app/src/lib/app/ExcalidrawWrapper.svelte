<script lang="ts">
  import { untrack } from "svelte";

  import {
    CaptureUpdateAction,
    SvelteDraw,
    LiveCollaborationTrigger,
    TTDDialogTrigger,
    useSvelteDrawAPI,
  } from "@svelte-draw/editor";
  import { trackEvent } from "@svelte-draw/editor/analytics";
  import { getDefaultAppState } from "@svelte-draw/editor/appState";
  import { DEFAULT_CATEGORIES } from "@svelte-draw/editor/components/CommandPalette/CommandPalette";
  import CommandPalette from "@svelte-draw/editor/components/CommandPalette/CommandPalette.svelte";
  import ErrorDialog from "@svelte-draw/editor/components/ErrorDialog.svelte";
  import { OverwriteConfirmDialog } from "@svelte-draw/editor/components/OverwriteConfirm/OverwriteConfirm";
  import ShareableLinkDialog from "@svelte-draw/editor/components/ShareableLinkDialog.svelte";
  import {
    EVENT,
    VERSION_TIMEOUT,
    debounce,
    getFrame,
    getVersion,
    isDevEnv,
    isRunningInIframe,
    isTestEnv,
    preventUnload,
    resolvablePromise,
  } from "@svelte-draw/common";
  import { isElementLink } from "@svelte-draw/element";
  import { isInitializedImageElement, newElementWith } from "@svelte-draw/element";
  import { useHandleLibrary } from "@svelte-draw/editor/data/handleLibrary.svelte";
  import { parseLibraryTokensFromUrl } from "@svelte-draw/editor/data/library";
  import {
    restoreAppState,
    restoreElements,
  } from "@svelte-draw/editor/data/restore";
  import { t } from "@svelte-draw/editor/i18n";
  import { GithubIcon, share, usersIcon } from "@svelte-draw/editor/components/icons";

  import type {
    FileId,
    NonDeletedExcalidrawElement,
    OrderedExcalidrawElement,
  } from "@svelte-draw/element/types";
  import type {
    AppState,
    BinaryFiles,
    SvelteDrawInitialData,
    SvelteDrawProps,
    UIAppState,
  } from "@svelte-draw/editor/types";
  import type { ResolutionType } from "@svelte-draw/common/utility-types";

  import AIComponents from "./components/AI.svelte";
  import AppFooter from "./components/AppFooter.svelte";
  import AppMainMenu from "./components/AppMainMenu.svelte";
  import AppWelcomeScreen from "./components/AppWelcomeScreen.svelte";
  import DebugCanvas from "./components/DebugCanvas.svelte";
  import {
    debugRenderer,
    isVisualDebuggerEnabled,
    loadSavedDebugState,
  } from "./components/DebugCanvas.ts";
  import FollowingLabel from "./components/FollowingLabel.svelte";
  import {
    isAIConfigured,
    isCollabConfigured,
    isShareLinkConfigured,
  } from "./app_config.ts";
  import {
    FIREBASE_STORAGE_PREFIXES,
    REPOSITORY_URL,
    STORAGE_KEYS,
    SYNC_BROWSER_TABS_TIMEOUT,
  } from "./app_constants.ts";
  import {
    appAtomStore,
    collabAPIAtom,
    isCollaboratingAtom,
    isOfflineAtom,
    localStorageQuotaExceededAtom,
    userToFollowAtom,
    useAtom,
    collabErrorDialogAtom,
    collabErrorIndicatorAtom,
  } from "./app-atoms.ts";
  import { getPreferredLanguage } from "./app-language/language-detector.ts";
  import {
    appLangCodeAtom,
    setAppLangCode,
    startAppLangCodePersistence,
  } from "./app-language/language-state.ts";
  import { useHandleAppTheme } from "./appTheme.svelte.ts";
  import Collab from "./collab/Collab.ts";
  import CollabError from "./collab/CollabError.svelte";
  import CustomStats from "./CustomStats.svelte";
  import { startSimulatedCollaborators } from "./debugCollaborators.ts";
  import {
    exportToBackend,
    isCollaborationLink,
  } from "./data/index.ts";
  import { updateStaleImageStatuses } from "./data/FileManager.ts";
  import { FileStatusStore } from "./data/fileStatusStore.ts";
  import { loadFilesFromFirebase } from "./data/firebase.ts";
  import {
    importFromLocalStorage,
    importUsernameFromLocalStorage,
  } from "./data/localStorage.ts";
  import {
    LibraryIndexedDBAdapter,
    LibraryLocalStorageMigrationAdapter,
    LocalData,
  } from "./data/LocalData.ts";
  import { isBrowserStorageStateNewer } from "./data/tabSync.ts";
  import { initializeScene } from "./initializeScene.ts";
  import { clearPWAInstallEvent, getPWAInstallEvent } from "./pwaInstall.ts";
  import ShareDialog from "./share/ShareDialog.svelte";
  import { shareDialogStateAtom } from "./share/ShareDialog.ts";

  const excalidrawAPI = useSvelteDrawAPI();

  let errorMessage = $state("");
  // collaboration also needs a configured backend (websocket server + Firebase),
  // see `app_config.ts`; without one the related UI is hidden
  const isCollabDisabled = isRunningInIframe() || !isCollabConfigured;

  // keep the handle object: its getters must stay reactive (don't destructure)
  const theme = useHandleAppTheme();

  const langCode = useAtom(appLangCodeAtom);
  $effect(() => startAppLangCodePersistence());

  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromise = resolvablePromise<SvelteDrawInitialData | null>();

  let debugCanvas = $state<HTMLCanvasElement | null>(null);

  $effect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    const timer = setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
    return () => clearTimeout(timer);
  });

  const shareDialogState = useAtom(shareDialogStateAtom);
  const collabAPI = useAtom(collabAPIAtom);
  const isCollaborating = useAtom(isCollaboratingAtom);
  const isOffline = useAtom(isOfflineAtom);
  const collabError = useAtom(collabErrorIndicatorAtom);
  const collabErrorDialog = useAtom(collabErrorDialogAtom);
  const userToFollow = useAtom(userToFollowAtom);
  const localStorageQuotaExceeded = useAtom(localStorageQuotaExceededAtom);

  // initial value only: whether we're loading from a collaboration link
  appAtomStore.set(isCollaboratingAtom, isCollaborationLink(window.location.href));

  const viewportStatusFrame = $derived(
    userToFollow.current
      ? {
          border: "var(--color-primary-hover)",
          label: {
            label: {
              component: FollowingLabel,
              props: { username: userToFollow.current.username },
            },
            onClose: () => collabAPI.current?.setUserToFollow(null),
          },
        }
      : null,
  );

  useHandleLibrary(() => ({
    excalidrawAPI: excalidrawAPI.current,
    adapter: LibraryIndexedDBAdapter,
    // TODO maybe remove this in several months (shipped: 24-03-11)
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
  }));

  // forces a re-render of things that read non-reactive editor state
  let refreshRevision = $state(0);
  const forceRefresh = () => {
    // read-modify-write: untracked so calling it from an effect doesn't make
    // that effect depend on (and re-trigger itself through) the counter
    untrack(() => {
      refreshRevision++;
    });
  };

  $effect(() => {
    void excalidrawAPI.current;
    if (isDevEnv()) {
      const debugState = loadSavedDebugState();

      if (debugState.enabled && !window.visualDebug) {
        window.visualDebug = {
          data: [],
        };
      } else {
        delete window.visualDebug;
      }
      forceRefresh();
    }
  });

  // ?collaborators=<N> — populate the canvas with N static fake
  // collaborators for exercising avatar/UserList UI without a real
  // collab room
  $effect(() => {
    const api = excalidrawAPI.current;
    if (!api) {
      return;
    }
    return startSimulatedCollaborators(api);
  });

  // collaboration: one `Collab` instance per editor instance
  $effect(() => {
    const api = excalidrawAPI.current;
    if (!api || isCollabDisabled) {
      return;
    }
    const collab = new Collab(api);
    collab.start();
    return () => collab.destroy();
  });

  // ---------------------------------------------------------------------------
  // Hoisted loadImages
  // ---------------------------------------------------------------------------
  const loadImages = (
    data: ResolutionType<typeof initializeScene>,
    isInitialLoad = false,
  ) => {
    const api = excalidrawAPI.current;
    const collab = collabAPI.current;
    if (!data.scene || !api) {
      return;
    }

    if (collab?.isCollaborating()) {
      if (data.scene.elements) {
        collab
          .fetchImageFilesFromFirebase({
            elements: data.scene.elements,
            forceFetchFiles: true,
          })
          .then(({ loadedFiles, erroredFiles }) => {
            api.addFiles(loadedFiles);
            updateStaleImageStatuses({
              excalidrawAPI: api,
              erroredFiles,
              elements: api.getSceneElementsIncludingDeleted(),
            });
          });
      }
    } else {
      const fileIds =
        data.scene.elements?.reduce((acc, element) => {
          if (isInitializedImageElement(element)) {
            return acc.concat(element.fileId);
          }
          return acc;
        }, [] as FileId[]) || [];

      if (data.isExternalScene) {
        if (fileIds.length) {
          // Direct Firebase call (not through FileManager), so track manually
          FileStatusStore.updateStatuses(fileIds.map((id) => [id, "loading"]));
        }
        loadFilesFromFirebase(
          `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
          data.key,
          fileIds,
        ).then(({ loadedFiles, erroredFiles }) => {
          api.addFiles(loadedFiles);
          updateStaleImageStatuses({
            excalidrawAPI: api,
            erroredFiles,
            elements: api.getSceneElementsIncludingDeleted(),
          });
          FileStatusStore.updateStatuses([
            ...loadedFiles.map((f) => [f.id, "loaded"] as [FileId, "loaded"]),
            ...[...erroredFiles.keys()].map(
              (id) => [id, "error"] as [FileId, "error"],
            ),
          ]);
        });
      } else if (isInitialLoad) {
        if (fileIds.length) {
          LocalData.fileStorage
            .getFiles(fileIds)
            .then(async ({ loadedFiles, erroredFiles }) => {
              if (loadedFiles.length) {
                api.addFiles(loadedFiles);
              }
              updateStaleImageStatuses({
                excalidrawAPI: api,
                erroredFiles,
                elements: api.getSceneElementsIncludingDeleted(),
              });
            });
        }
        // on fresh load, clear unused files from IDB (from previous
        // session)
        LocalData.fileStorage.clearObsoleteFiles({
          currentFileIds: fileIds,
        });
      }
    }
  };

  $effect(() => {
    // the dependencies of the setup below (as in the React `useEffect`)
    const api = excalidrawAPI.current;
    const collab = collabAPI.current;
    if (!api || (!isCollabDisabled && !collab)) {
      return;
    }

    return untrack(() => {
      initializeScene({ collabAPI: collab, excalidrawAPI: api }).then(
        async (data) => {
          loadImages(data, /* isInitialLoad */ true);
          initialStatePromise.resolve(data.scene);
        },
      );

      const onHashChange = async (event: HashChangeEvent) => {
        event.preventDefault();
        const libraryUrlTokens = parseLibraryTokensFromUrl();
        if (!libraryUrlTokens) {
          if (
            collab?.isCollaborating() &&
            !isCollaborationLink(window.location.href)
          ) {
            collab.stopCollaboration(false);
          }
          api.updateScene({ appState: { isLoading: true } });

          initializeScene({ collabAPI: collab, excalidrawAPI: api }).then(
            (data) => {
              loadImages(data);
              if (data.scene) {
                api.updateScene({
                  elements: restoreElements(data.scene.elements, null, {
                    repairBindings: true,
                  }),
                  appState: restoreAppState(data.scene.appState, null),
                  captureUpdate: CaptureUpdateAction.IMMEDIATELY,
                });
              }
            },
          );
        }
      };

      const syncData = debounce(() => {
        if (isTestEnv()) {
          return;
        }
        if (
          !document.hidden &&
          ((collab && !collab.isCollaborating()) || isCollabDisabled)
        ) {
          // don't sync if local state is newer or identical to browser state
          if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
            const localDataState = importFromLocalStorage();
            const username = importUsernameFromLocalStorage();
            setAppLangCode(getPreferredLanguage());
            api.updateScene({
              ...localDataState,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
            LibraryIndexedDBAdapter.load().then((data) => {
              if (data) {
                api.updateLibrary({
                  libraryItems: data.libraryItems,
                });
              }
            });
            collab?.setUsername(username || "");
          }

          if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
            const elements = api.getSceneElementsIncludingDeleted();
            const currFiles = api.getFiles();
            const fileIds =
              elements?.reduce((acc, element) => {
                if (
                  isInitializedImageElement(element) &&
                  // only load and update images that aren't already loaded
                  !currFiles[element.fileId]
                ) {
                  return acc.concat(element.fileId);
                }
                return acc;
              }, [] as FileId[]) || [];
            if (fileIds.length) {
              LocalData.fileStorage
                .getFiles(fileIds)
                .then(({ loadedFiles, erroredFiles }) => {
                  if (loadedFiles.length) {
                    api.addFiles(loadedFiles);
                  }
                  updateStaleImageStatuses({
                    excalidrawAPI: api,
                    erroredFiles,
                    elements: api.getSceneElementsIncludingDeleted(),
                  });
                });
            }
          }
        }
      }, SYNC_BROWSER_TABS_TIMEOUT);

      const onUnload = () => {
        LocalData.flushSave();
      };

      const visibilityChange = (event: FocusEvent | Event) => {
        if (event.type === EVENT.BLUR || document.hidden) {
          LocalData.flushSave();
        }
        if (
          event.type === EVENT.VISIBILITY_CHANGE ||
          event.type === EVENT.FOCUS
        ) {
          syncData();
        }
      };

      window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.addEventListener(EVENT.PAGE_HIDE, onUnload, false);
      window.addEventListener(EVENT.BLUR, visibilityChange, false);
      document.addEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
      window.addEventListener(EVENT.FOCUS, visibilityChange, false);
      return () => {
        window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
        window.removeEventListener(EVENT.PAGE_HIDE, onUnload, false);
        window.removeEventListener(EVENT.BLUR, visibilityChange, false);
        window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
        document.removeEventListener(
          EVENT.VISIBILITY_CHANGE,
          visibilityChange,
          false,
        );
      };
    });
  });

  $effect(() => {
    const api = excalidrawAPI.current;
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        api &&
        LocalData.fileStorage.shouldPreventUnload(api.getSceneElements())
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        } else {
          console.warn(
            "preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
          );
        }
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  });

  const onChange = (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    const api = excalidrawAPI.current;
    const collab = collabAPI.current;

    if (collab?.isCollaborating()) {
      collab.syncElements(elements);
    }

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (api) {
          let didChange = false;

          const elements = api
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            api.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
          }
        }
      });
    }

    // Render the debug scene if the debug canvas is available
    if (debugCanvas && api) {
      debugRenderer(debugCanvas, appState, elements, window.devicePixelRatio);
    }
  };

  let latestShareableLink = $state<string | null>(null);

  const onExportToBackend = async (
    exportedElements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => {
    if (exportedElements.length === 0) {
      throw new Error(t("alerts.cannotExportEmptyCanvas"));
    }
    try {
      const { url, errorMessage } = await exportToBackend(
        exportedElements,
        {
          ...appState,
          viewBackgroundColor: appState.exportBackground
            ? appState.viewBackgroundColor
            : getDefaultAppState().viewBackgroundColor,
        },
        files,
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (url) {
        latestShareableLink = url;
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        const { width, height } = appState;
        console.error(error, {
          width,
          height,
          devicePixelRatio: window.devicePixelRatio,
        });
        throw new Error(error.message);
      }
    }
  };

  const isCollabAvailable = $derived(
    !isCollabDisabled && (!isOffline.current || isCollaborating.current),
  );

  $effect(() => {
    if (!isCollabAvailable) {
      shareDialogState.current = { isOpen: false };
    }
  });

  const onCollabDialogOpen = () => {
    shareDialogState.current = { isOpen: true, type: "collaborationOnly" };
  };

  // ---------------------------------------------------------------------------
  // onExport — intercepts file save to wait for pending image loads
  // ---------------------------------------------------------------------------
  const onExport: Required<SvelteDrawProps>["onExport"] = async function* () {
    let snapshot = FileStatusStore.getSnapshot();
    const { pending, total } = FileStatusStore.getPendingCount(snapshot.value);
    if (pending === 0) {
      return;
    }

    // Yield initial progress
    yield {
      type: "progress",
      progress: (total - pending) / total,
      message: `Loading images (${total - pending}/${total})...`,
    };

    // Wait for all pending images to finish
    while (true) {
      snapshot = await FileStatusStore.pull(snapshot.version);
      const { pending: nowPending, total: nowTotal } =
        FileStatusStore.getPendingCount(snapshot.value);

      yield {
        type: "progress",
        progress: (nowTotal - nowPending) / nowTotal,
        message: `Loading images (${nowTotal - nowPending}/${nowTotal})...`,
      };

      if (nowPending === 0) {
        await new Promise((r) => setTimeout(r, 500));
        yield {
          type: "progress",
          message: `Preparing export...`,
        };
        return;
      }
    }
  };

  // browsers generally prevent infinite self-embedding, there are
  // cases where it still happens, and while we disallow self-embedding
  // by not whitelisting our own origin, this serves as an additional guard
  const isSelfEmbedding = (() => {
    if (window.self === window.top) {
      return false;
    }
    try {
      const parentUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      return parentUrl.origin === currentUrl.origin;
    } catch {
      return false;
    }
  })();

  // PWA install prompt: the event is captured as early as possible in
  // `pwaInstall.ts` (it may fire before this component mounts)

  const customCommandPaletteItems = $derived([
    {
      label: t("labels.liveCollaboration"),
      category: DEFAULT_CATEGORIES.app,
      predicate: isCollabAvailable,
      keywords: [
        "team",
        "multiplayer",
        "share",
        "public",
        "session",
        "invite",
      ],
      icon: usersIcon,
      perform: () => {
        shareDialogState.current = { isOpen: true, type: "collaborationOnly" };
      },
    },
    {
      label: t("roomDialog.button_stopSession"),
      category: DEFAULT_CATEGORIES.app,
      predicate: () => !!collabAPI.current?.isCollaborating(),
      keywords: [
        "stop",
        "session",
        "end",
        "leave",
        "close",
        "exit",
        "collaboration",
      ],
      perform: () => {
        const collab = collabAPI.current;
        if (collab) {
          collab.stopCollaboration();
          if (!collab.isCollaborating()) {
            shareDialogState.current = { isOpen: false };
          }
        }
      },
    },
    {
      label: t("labels.share"),
      category: DEFAULT_CATEGORIES.app,
      predicate: isCollabAvailable,
      icon: share,
      keywords: [
        "link",
        "shareable",
        "readonly",
        "export",
        "publish",
        "snapshot",
        "url",
        "collaborate",
        "invite",
      ],
      perform: async () => {
        shareDialogState.current = { isOpen: true, type: "share" };
      },
    },
    {
      label: "GitHub",
      icon: GithubIcon,
      category: DEFAULT_CATEGORIES.links,
      predicate: !!REPOSITORY_URL,
      keywords: [
        "issues",
        "bugs",
        "requests",
        "report",
        "features",
        "source",
        "community",
      ],
      perform: () => {
        window.open(REPOSITORY_URL, "_blank", "noopener noreferrer");
      },
    },
    {
      label: t("labels.installPWA"),
      category: DEFAULT_CATEGORIES.app,
      predicate: () => !!getPWAInstallEvent(),
      perform: () => {
        const pwaEvent = getPWAInstallEvent();
        if (pwaEvent) {
          pwaEvent.prompt();
          pwaEvent.userChoice.then(() => {
            // event cannot be reused, but we'll hopefully
            // grab new one as the event should be fired again
            clearPWAInstallEvent();
          });
        }
      },
    },
  ]);
</script>

{#snippet renderCustomStats(
  elements: readonly NonDeletedExcalidrawElement[],
  appState: UIAppState,
)}
  <CustomStats
    setToast={(message) => excalidrawAPI.current!.setToast({ message })}
    {appState}
    {elements}
  />
{/snippet}

{#snippet renderTopRightUI(isMobile: boolean)}
  {#if !isMobile && collabAPI.current && isCollabAvailable}
    <div class="excalidraw-ui-top-right">
      {#if collabError.current.message}
        <CollabError collabError={collabError.current} />
      {/if}
      <LiveCollaborationTrigger
        isCollaborating={isCollaborating.current}
        onSelect={() => {
          shareDialogState.current = { isOpen: true, type: "share" };
        }}
      />
    </div>
  {/if}
{/snippet}

{#if isSelfEmbedding}
  <div
    style:display="flex"
    style:align-items="center"
    style:justify-content="center"
    style:text-align="center"
    style:height="100%"
  >
    <h1>I'm not a pretzel!</h1>
  </div>
{:else}
  <div
    style:height="100%"
    class={["excalidraw-app", { "is-collaborating": isCollaborating.current }]}
  >
    <SvelteDraw
      {viewportStatusFrame}
      userToFollow={userToFollow.current}
      {onChange}
      {onExport}
      initialData={initialStatePromise}
      isCollaborating={isCollaborating.current}
      onPointerUpdate={collabAPI.current?.onPointerUpdate}
      UIOptions={{
        canvasActions: {
          toggleTheme: true,
          // "export to link" is only offered when the share-link backend is configured
          export: isShareLinkConfigured ? { onExportToBackend } : {},
        },
      }}
      langCode={langCode.current}
      aiEnabled={isAIConfigured}
      {renderCustomStats}
      detectScroll={false}
      handleKeyboardGlobally={true}
      autoFocus={true}
      theme={theme.editorTheme}
      onThemeChange={theme.setAppTheme}
      {renderTopRightUI}
      onLinkOpen={(element, event) => {
        if (element.link && isElementLink(element.link)) {
          event.preventDefault();
          excalidrawAPI.current?.setViewport({
            target: element.link,
            fit: "scale-down",
            animation: true,
          });
        }
      }}
    >
      <AppMainMenu
        {onCollabDialogOpen}
        isCollaborating={isCollaborating.current}
        isCollabEnabled={isCollabAvailable}
        theme={theme.appTheme}
        refresh={forceRefresh}
      />
      <AppWelcomeScreen {onCollabDialogOpen} isCollabEnabled={isCollabAvailable} />
      <OverwriteConfirmDialog>
        <OverwriteConfirmDialog.Actions.ExportToImage />
        <OverwriteConfirmDialog.Actions.SaveToDisk />
      </OverwriteConfirmDialog>
      <AppFooter onChange={() => excalidrawAPI.current?.refresh()} />
      {#if excalidrawAPI.current && isAIConfigured}
        <AIComponents excalidrawAPI={excalidrawAPI.current} />
      {/if}

      {#if isAIConfigured}
        <TTDDialogTrigger />
      {/if}
      {#if isCollaborating.current && isOffline.current}
        <div class="alert alert--warning">
          {t("alerts.collabOfflineWarning")}
        </div>
      {/if}
      {#if localStorageQuotaExceeded.current}
        <div class="alert alert--danger">
          {t("alerts.localStorageQuotaExceeded")}
        </div>
      {/if}
      {#if latestShareableLink}
        <ShareableLinkDialog
          link={latestShareableLink}
          onCloseRequest={() => (latestShareableLink = null)}
          setErrorMessage={(message) => (errorMessage = message)}
        />
      {/if}
      {#if collabErrorDialog.current}
        <ErrorDialog onClose={() => collabAPI.current?.setCollabError(null)}>
          {collabErrorDialog.current}
        </ErrorDialog>
      {/if}

      <ShareDialog
        collabAPI={collabAPI.current}
        onExportToBackend={async () => {
          const api = excalidrawAPI.current;
          if (api) {
            try {
              await onExportToBackend(
                api.getSceneElements(),
                api.getAppState(),
                api.getFiles(),
              );
            } catch (error: any) {
              errorMessage = error.message;
            }
          }
        }}
      />

      {#if errorMessage}
        <ErrorDialog onClose={() => (errorMessage = "")}>
          {errorMessage}
        </ErrorDialog>
      {/if}

      <CommandPalette {customCommandPaletteItems} />
      {#if isVisualDebuggerEnabled() && excalidrawAPI.current}
        {#key refreshRevision}
          <DebugCanvas
            appState={excalidrawAPI.current.getAppState()}
            scale={window.devicePixelRatio}
            bind:element={debugCanvas}
          />
        {/key}
      {/if}
    </SvelteDraw>
  </div>
{/if}
