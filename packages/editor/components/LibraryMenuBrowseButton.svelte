<script lang="ts">
  import { VERSIONS } from "@svelte-draw/common";

  import { t } from "../i18n";
  import { getLibraryBrowseUrl } from "../libraryConfig";

  import type { SvelteDrawProps, UIAppState } from "../types";

  type Props = {
    libraryReturnUrl: SvelteDrawProps["libraryReturnUrl"];
    theme: UIAppState["theme"];
    id: string;
  };

  let { theme, id, libraryReturnUrl }: Props = $props();

  const referrer = $derived(
    libraryReturnUrl || window.location.origin + window.location.pathname,
  );
  // hidden unless a library site is configured (VITE_APP_LIBRARY_URL)
  const browseUrl = getLibraryBrowseUrl();
  const href = $derived(
    `${browseUrl}?target=${
      window.name || "_blank"
    }&referrer=${referrer}&useHash=true&token=${id}&theme=${theme}&version=${
      VERSIONS.excalidrawLibrary
    }`,
  );
</script>

{#if browseUrl}
  <a class="library-menu-browse-button" {href} target="_excalidraw_libraries">
    {t("labels.libraries")}
  </a>
{/if}
