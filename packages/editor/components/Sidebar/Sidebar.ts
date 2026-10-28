import { isSidebarDockedAtom } from "./common";
import SidebarComponent from "./Sidebar.svelte";
import SidebarHeader from "./SidebarHeader.svelte";
import SidebarTab from "./SidebarTab.svelte";
import SidebarTabs from "./SidebarTabs.svelte";
import SidebarTabTrigger from "./SidebarTabTrigger.svelte";
import SidebarTabTriggers from "./SidebarTabTriggers.svelte";
import SidebarTrigger from "./SidebarTrigger.svelte";

export { isSidebarDockedAtom };

/**
 * `<Sidebar name>` with its parts: `<Sidebar.Header>`,
 * `<Sidebar.TabTriggers>`, `<Sidebar.TabTrigger>`, `<Sidebar.Tabs>`,
 * `<Sidebar.Tab>`, `<Sidebar.Trigger>`.
 */
export const Sidebar = Object.assign(SidebarComponent, {
  Header: SidebarHeader,
  TabTriggers: SidebarTabTriggers,
  TabTrigger: SidebarTabTrigger,
  Tabs: SidebarTabs,
  Tab: SidebarTab,
  Trigger: SidebarTrigger,
});

export default Sidebar;
