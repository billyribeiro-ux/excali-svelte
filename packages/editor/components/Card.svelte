<script lang="ts">
  import type { Snippet } from "svelte";

  import "./Card.scss";

  // for open-color see https://github.com/yeun/open-color/blob/master/open-color.scss
  const COLOR_MAP = {
    primary: {
      base: "var(--color-primary)",
      darker: "var(--color-primary-darker)",
      darkest: "var(--color-primary-darkest)",
    },
    lime: {
      base: "#74b816", // open-color lime[7]
      darker: "#66a80f", // open-color lime[8]
      darkest: "#5c940d", // open-color lime[9]
    },
    pink: {
      base: "#d6336c", // open-color pink[7]
      darker: "#c2255c", // open-color pink[8]
      darkest: "#a61e4d", // open-color pink[9]
    },
  };

  type Props = {
    color: keyof typeof COLOR_MAP;
    children?: Snippet;
  };

  let { color, children }: Props = $props();
</script>

<div
  class="Card"
  style:--card-color={COLOR_MAP[color].base}
  style:--card-color-darker={COLOR_MAP[color].darker}
  style:--card-color-darkest={COLOR_MAP[color].darkest}
>
  {@render children?.()}
</div>
