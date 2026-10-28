<script lang="ts">
  import { setEditorContext } from "../ui/editorContext";

  import UserList from "./UserList.svelte";

  import type { ComponentProps } from "svelte";
  import type { EditorContextValue } from "../ui/editorContext";

  let {
    ctx,
    ...props
  }: { ctx: EditorContextValue } & ComponentProps<typeof UserList> = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<UserList {...props} />
