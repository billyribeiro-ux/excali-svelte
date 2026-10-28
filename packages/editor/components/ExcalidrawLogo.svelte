<script lang="ts">
  import "./ExcalidrawLogo.scss";

  type LogoSize = "xs" | "small" | "normal" | "large" | "custom" | "mobile";

  type Props = {
    size?: LogoSize;
    withText?: boolean;
    /** inline style string (was `React.CSSProperties` in the React version) */
    style?: string;
    /**
     * If true, the logo will not be wrapped in a Link component.
     * The link prop will be ignored as well.
     * It will merely be a plain div.
     */
    isNotLink?: boolean;
  };

  let { style, size = "small", withText }: Props = $props();
</script>

<!--
  The svelte-draw mark (see `branding/logo.svg`): a teal rounded square with a
  hand-drawn "S" stroke ending in a pencil tip. The file and the scss class
  names (`ExcalidrawLogo*`) are kept for styling/test compatibility.
-->
<div class="ExcalidrawLogo is-{size}" {style}>
  <svg
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    class="ExcalidrawLogo-icon"
    role="img"
    aria-label="svelte-draw"
  >
    <rect width="512" height="512" rx="112" fill="#0f766e" />
    <path
      d="M352 158c-28-38-118-48-158 2-38 48 16 84 66 98 58 15 108 52 70 104-40 54-146 46-182-8"
      fill="none"
      stroke="#f8fafc"
      stroke-width="38"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M148 346l-34 56 62-22z"
      fill="#fbbf24"
      stroke="#f8fafc"
      stroke-width="10"
      stroke-linejoin="round"
    />
  </svg>
  {#if withText}
    <svg
      viewBox="0 0 300 55"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      class="ExcalidrawLogo-text"
      role="img"
      aria-label="svelte-draw"
    >
      <text
        x="0"
        y="44"
        fill="currentColor"
        font-family="Excalifont, 'Segoe Print', 'Comic Sans MS', cursive, sans-serif"
        font-size="52"
        textLength="300"
        lengthAdjust="spacingAndGlyphs">svelte-draw</text>
    </svg>
  {/if}
</div>
