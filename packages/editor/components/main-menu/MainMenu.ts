import DropdownMenu from "../dropdownMenu/DropdownMenu";
import DropdownMenuSub from "../dropdownMenu/DropdownMenuSub";

import * as DefaultItems from "./DefaultItems";
import MainMenuComponent from "./MainMenu.svelte";

/**
 * `<MainMenu>` with its parts: `<MainMenu.Trigger>`, `<MainMenu.Item>`,
 * `<MainMenu.ItemLink>`, `<MainMenu.ItemCustom>`, `<MainMenu.Group>`,
 * `<MainMenu.Separator>`, `<MainMenu.Sub>` and the `MainMenu.DefaultItems`
 * namespace.
 */
const MainMenu = Object.assign(MainMenuComponent, {
  Trigger: DropdownMenu.Trigger,
  Item: DropdownMenu.Item,
  ItemLink: DropdownMenu.ItemLink,
  ItemCustom: DropdownMenu.ItemCustom,
  Group: DropdownMenu.Group,
  Separator: DropdownMenu.Separator,
  Sub: DropdownMenuSub,
  DefaultItems,
});

export default MainMenu;
