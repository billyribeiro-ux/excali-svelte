<script lang="ts">
  import * as Sentry from "@sentry/browser";

  import { REPOSITORY_NEW_ISSUE_URL } from "@svelte-draw/common";
  import Trans from "@svelte-draw/editor/components/Trans.svelte";
  import { t } from "@svelte-draw/editor/i18n";

  import { SENTRY_DSN } from "#lib/app/app_config.ts";

  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  let sentryEventId = $state("");
  let localStorageDump = $state("");

  // Replaces `componentDidCatch`. NOTE: Svelte boundaries do not provide a
  // React-style `errorInfo` (component stack), so there is nothing to pass to
  // `scope.setExtras()` any more.
  const handleError = (error: unknown) => {
    const _localStorage: Record<string, unknown> = {};
    for (const [key, value] of Object.entries({ ...localStorage })) {
      try {
        _localStorage[key] = JSON.parse(value);
      } catch (error: any) {
        _localStorage[key] = value;
      }
    }

    Sentry.withScope(() => {
      const eventId = Sentry.captureException(error);

      sentryEventId = eventId;
      localStorageDump = JSON.stringify(_localStorage);
    });
  };

  const selectTextArea = (event: PointerEvent) => {
    if (event.target !== document.activeElement) {
      event.preventDefault();
      (event.target as HTMLTextAreaElement).select();
    }
  };

  const createGithubIssue = async () => {
    let body = "";
    try {
      const templateStrFn = (
        await import(
          /* webpackChunkName: "bug-issue-template" */ "#lib/app/bug-issue-template.js"
        )
      ).default;
      body = encodeURIComponent(templateStrFn(sentryEventId));
    } catch (error: any) {
      console.error(error);
    }

    window.open(
      `${REPOSITORY_NEW_ISSUE_URL}?body=${body}`,
      "_blank",
      "noopener noreferrer",
    );
  };
</script>

<svelte:boundary onerror={handleError}>
  {@render children()}

  {#snippet failed()}
    <div class="ErrorSplash excalidraw">
      <div class="ErrorSplash-messageContainer">
        <div class="ErrorSplash-paragraph bigger align-center">
          <Trans i18nKey="errorSplash.headingMain" button={reloadButton} />
        </div>
        <div class="ErrorSplash-paragraph align-center">
          <Trans
            i18nKey="errorSplash.clearCanvasMessage"
            button={clearCanvasButton}
          />
          <br />
          <div class="smaller">
            <span role="img" aria-label="warning">⚠️</span>
            {t("errorSplash.clearCanvasCaveat")}
            <span role="img" aria-hidden="true">⚠️</span>
          </div>
        </div>
        <div>
          {#if SENTRY_DSN}
            <div class="ErrorSplash-paragraph">
              {t("errorSplash.trackedToSentry", {
                eventId: sentryEventId,
              })}
            </div>
          {/if}
          <div class="ErrorSplash-paragraph">
            <Trans
              i18nKey="errorSplash.openIssueMessage"
              button={openIssueButton}
            />
          </div>
          <div class="ErrorSplash-paragraph">
            <div class="ErrorSplash-details">
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label>{t("errorSplash.sceneContent")}</label>
              <textarea
                rows={5}
                onpointerdown={selectTextArea}
                readonly={true}
                value={localStorageDump}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/snippet}
</svelte:boundary>

{#snippet reloadButton(el: Snippet)}
  <button onclick={() => window.location.reload()}>{@render el()}</button>
{/snippet}

{#snippet clearCanvasButton(el: Snippet)}
  <button
    onclick={() => {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (error: any) {
        console.error(error);
      }
    }}
  >
    {@render el()}
  </button>
{/snippet}

{#snippet openIssueButton(el: Snippet)}
  <button onclick={() => createGithubIssue()}>{@render el()}</button>
{/snippet}
