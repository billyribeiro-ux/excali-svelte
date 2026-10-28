import Heading from "./Center/Heading.svelte";
import Logo from "./Center/Logo.svelte";
import Menu from "./Center/Menu.svelte";
import MenuItem from "./Center/MenuItem.svelte";
import MenuItemHelp from "./Center/MenuItemHelp.svelte";
import MenuItemLink from "./Center/MenuItemLink.svelte";
import MenuItemLiveCollaborationTrigger from "./Center/MenuItemLiveCollaborationTrigger.svelte";
import MenuItemLoadScene from "./Center/MenuItemLoadScene.svelte";
import CenterComponent from "./WelcomeScreen.Center.svelte";

/**
 * `<WelcomeScreen.Center>` with its parts: `Logo`, `Heading`, `Menu`,
 * `MenuItem`, `MenuItemLink`, `MenuItemHelp`, `MenuItemLoadScene`,
 * `MenuItemLiveCollaborationTrigger`.
 */
export const Center = Object.assign(CenterComponent, {
  Logo,
  Heading,
  Menu,
  MenuItem,
  MenuItemLink,
  MenuItemHelp,
  MenuItemLoadScene,
  MenuItemLiveCollaborationTrigger,
});
