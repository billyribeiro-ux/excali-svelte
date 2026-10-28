<script lang="ts">
  import { getEditorContext } from "../../ui/editorContext";

  import type { GenerateDiagramToCode } from "../../types";

  let { generate }: { generate: GenerateDiagramToCode } = $props();

  const editor = getEditorContext();

  // pre-effect: registered before the DOM updates, like `useLayoutEffect`
  $effect.pre(() => {
    editor.app.setPlugins({
      diagramToCode: { generate },
    });
  });
</script>
