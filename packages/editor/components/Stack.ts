import StackCol from "./StackCol.svelte";
import StackRow from "./StackRow.svelte";

/**
 * `Stack.Row` / `Stack.Col` namespace of the React original. Use as
 * `<Stack.Row gap={2}>` after `import Stack from "./Stack.ts"`.
 */
export default {
  Row: StackRow,
  Col: StackCol,
};
