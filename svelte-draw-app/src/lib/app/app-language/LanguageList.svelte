<script lang="ts">
  import { languages, useI18n } from "@svelte-draw/editor/i18n";

  import { setAppLangCode } from "#lib/app/app-language/language-state.ts";

  let { style }: { style?: string } = $props();

  const i18n = useI18n();
</script>

<select
  class="dropdown-select dropdown-select__language"
  onchange={({ currentTarget }) => setAppLangCode(currentTarget.value)}
  value={i18n.langCode}
  aria-label={i18n.t("buttons.selectLanguage")}
  {style}
>
  {#each languages as lang (lang.code)}
    <option value={lang.code}>
      {lang.label}
    </option>
  {/each}
</select>
