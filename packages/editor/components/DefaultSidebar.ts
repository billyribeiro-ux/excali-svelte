import DefaultSidebarComponent from "./DefaultSidebar.svelte";
import DefaultSidebarTabTriggers from "./DefaultSidebarTabTriggers.svelte";
import DefaultSidebarTrigger from "./DefaultSidebarTrigger.svelte";

/**
 * `<DefaultSidebar>` with `.Trigger` and `.TabTriggers` parts, the public API
 * host apps use.
 */
export const DefaultSidebar = Object.assign(DefaultSidebarComponent, {
  Trigger: DefaultSidebarTrigger,
  TabTriggers: DefaultSidebarTabTriggers,
});

export default DefaultSidebar;
