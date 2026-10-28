import DropdownMenuRoot from "./DropdownMenu.svelte";
import DropdownMenuContent from "./DropdownMenuContent.svelte";
import DropdownMenuGroup from "./DropdownMenuGroup.svelte";
import DropdownMenuItem from "./DropdownMenuItem";
import DropdownMenuItemCheckbox from "./DropdownMenuItemCheckbox.svelte";
import DropdownMenuItemCustom from "./DropdownMenuItemCustom.svelte";
import DropdownMenuItemLink from "./DropdownMenuItemLink.svelte";
import DropdownMenuSeparator from "./DropdownMenuSeparator.svelte";
import DropdownMenuSub from "./DropdownMenuSub";
import DropdownMenuTrigger from "./DropdownMenuTrigger.svelte";

/**
 * `<DropdownMenu open>` with its parts, e.g. `<DropdownMenu.Trigger>`,
 * `<DropdownMenu.Content>`, `<DropdownMenu.Item>`.
 */
const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  ItemCheckbox: DropdownMenuItemCheckbox,
  ItemLink: DropdownMenuItemLink,
  ItemCustom: DropdownMenuItemCustom,
  Group: DropdownMenuGroup,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
});

export default DropdownMenu;
