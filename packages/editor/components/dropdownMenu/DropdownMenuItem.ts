import DropdownMenuItemComponent from "./DropdownMenuItem.svelte";
import DropDownMenuItemBadge from "./DropDownMenuItemBadge.svelte";

export { DropDownMenuItemBadgeType } from "./common";
export { DropDownMenuItemBadge };

/** `<DropdownMenuItem>` with a `.Badge` part */
const DropdownMenuItem = Object.assign(DropdownMenuItemComponent, {
  Badge: DropDownMenuItemBadge,
});

export default DropdownMenuItem;
