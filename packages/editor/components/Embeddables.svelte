<script lang="ts">
  import { POINTER_EVENTS } from "@svelte-draw/common";
  import { isEmbeddableElement } from "@svelte-draw/element";

  import { t } from "../i18n";

  import Spinner from "./Spinner.svelte";

  import type { App } from "../types";
  import type { AppState } from "../types";
  import type { EmbeddableRenderModel } from "./renderModel";

  type Props = {
    app: App;
    appState: AppState;
    embeddables: EmbeddableRenderModel[];
  };

  let { app, appState, embeddables }: Props = $props();

  const api = $derived(app.viewApi);

  const renderEmbeddable = $derived(app.props.renderEmbeddable);

  /** hands the iframe to the editor (it tracks them by element id) */
  const trackIframe = (model: EmbeddableRenderModel) => (iframe: HTMLIFrameElement) => {
    api.cacheEmbeddableRef(model.element, iframe);
    return () => {
      api.cacheEmbeddableRef(model.element, null);
    };
  };
</script>

{#each embeddables as model (model.element.id)}
  {@const el = model.element}
  {@const src = model.src}
  <div
    class={["excalidraw__embeddable-container", { "is-hovered": model.isHovered }]}
    style:transform={model.isVisible
      ? `translate(${model.translateX}px, ${model.translateY}px) scale(${appState.zoom.value})`
      : "none"}
    style:display={model.isVisible ? "block" : "none"}
    style:opacity={model.opacity}
    style:--embeddable-radius="{model.cornerRadius}px"
  >
    <div
      class="excalidraw__embeddable-container__inner"
      style:width={model.isVisible ? `${el.width}px` : 0}
      style:height={model.isVisible ? `${el.height}px` : 0}
      style:transform={model.isVisible ? `rotate(${el.angle}rad)` : "none"}
      style:pointer-events={model.isActive
        ? POINTER_EVENTS.enabled
        : POINTER_EVENTS.disabled}
    >
      {#if model.isHovered}
        <div class="excalidraw__embeddable-hint">
          {t("buttons.embeddableInteractionButton")}
        </div>
      {/if}
      <div
        class="excalidraw__embeddable__outer"
        style:padding="{el.strokeWidth}px"
      >
        <div
          class="excalidraw__embeddable__content"
          style:width="{model.viewportScale * 100}%"
          style:height="{model.viewportScale * 100}%"
          style:transform="scale({1 / model.viewportScale})"
        >
          {#if isEmbeddableElement(el) && renderEmbeddable}
            {@render renderEmbeddable(el, appState)}
          {:else}
            <iframe
              {@attach trackIframe(model)}
              class="excalidraw__embeddable"
              srcdoc={src?.type === "document"
                ? src.srcdoc(appState.theme)
                : undefined}
              src={src?.type !== "document" ? (src?.link ?? "") : undefined}
              scrolling="no"
              referrerpolicy="no-referrer-when-downgrade"
              title="svelte-draw Embedded Content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen={true}
              sandbox="{src?.sandbox?.allowSameOrigin
                ? 'allow-same-origin'
                : ''} allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
            ></iframe>
          {/if}
        </div>
      </div>
      {#if model.isPendingGeneration}
        <div class="excalidraw__embeddable__generating">
          <Spinner size="1em" />
          Generating…
        </div>
      {/if}
    </div>
  </div>
{/each}
