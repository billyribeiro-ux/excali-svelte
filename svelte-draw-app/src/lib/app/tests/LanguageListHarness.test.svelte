<script lang="ts">
  import { SvelteDraw, MainMenu } from "@svelte-draw/editor";

  import { appLangCodeAtom, useAtomValue } from "#lib/app/app-atoms.ts";
  import LanguageList from "#lib/app/app-language/LanguageList.svelte";

  const langCode = useAtomValue(appLangCodeAtom);
</script>

<SvelteDraw langCode={langCode.current}>
  <MainMenu>
    <MainMenu.ItemCustom>
      <LanguageList />
    </MainMenu.ItemCustom>
  </MainMenu>
</SvelteDraw>
