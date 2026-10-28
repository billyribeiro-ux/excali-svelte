import DropdownMenuSubRoot from "./DropdownMenuSub.svelte";
import DropdownMenuSubContent from "./DropdownMenuSubContent.svelte";
import DropdownMenuSubTrigger from "./DropdownMenuSubTrigger.svelte";

/** `<DropdownMenuSub>` with `.Trigger` / `.Content` parts */
const DropdownMenuSub = Object.assign(DropdownMenuSubRoot, {
  Trigger: DropdownMenuSubTrigger,
  Content: DropdownMenuSubContent,
});

export default DropdownMenuSub;
