import { untrack } from "svelte";

import { getTunnels } from "../../context/tunnels";

/**
 * Number of mounted *host* (non-fallback) instances of one internal component
 * (e.g. `MainMenu`) within one editor instance.
 */
class HostRegistry {
  hosts = $state(0);
}

/**
 * Registries are scoped per editor instance by keying on the tunnels object
 * (one is created per editor, see `context/tunnels.ts`). This is what the
 * React version achieved with a `jotai-scope` isolation + a per-HOC atom.
 */
const registries = new WeakMap<object, Map<string, HostRegistry>>();

const getRegistry = (scope: object, name: string) => {
  let byName = registries.get(scope);
  if (!byName) {
    byName = new Map();
    registries.set(scope, byName);
  }
  let registry = byName.get(name);
  if (!registry) {
    registry = new HostRegistry();
    byName.set(name, registry);
  }
  return registry;
};

/**
 * Svelte replacement of the `withInternalFallback(name, Component)` HOC.
 *
 * Internal components (MainMenu, DefaultSidebar, DefaultSidebarTrigger,
 * OverwriteConfirmDialog, TTDDialog) are rendered by the editor with
 * `__fallback`, and may be rendered by the host app as well (the host version
 * wins). Call this once in the component's script and gate the markup on
 * `shouldRender`:
 *
 * ```svelte
 * const fallback = useInternalFallback("MainMenu", () => __fallback);
 * {#if fallback.shouldRender} ... {/if}
 * ```
 *
 * - a host instance registers itself synchronously during component
 *   initialization (so a fallback that is created later never renders), and
 *   unregisters when destroyed;
 * - a fallback instance renders only while no host instance is mounted. If the
 *   host mounts after the fallback (or unmounts), `shouldRender` updates
 *   reactively, so the fallback disappears/reappears in the same flush.
 *
 * Whether an instance is a fallback is decided when it is created (like the
 * React HOC, `__fallback` is not expected to change over the lifetime).
 *
 * Must be called during component initialization, inside the tree that has
 * `setTunnels()` applied.
 */
export const useInternalFallback = (
  name: string,
  isFallback: () => boolean | undefined,
) => {
  const registry = getRegistry(getTunnels(), name);
  const registersAsHost = !isFallback();

  if (registersAsHost) {
    untrack(() => {
      registry.hosts += 1;
    });
    $effect(() => {
      return () => {
        untrack(() => {
          registry.hosts -= 1;
        });
      };
    });
  }

  return {
    /** `false` for a fallback instance while a host instance is mounted */
    get shouldRender() {
      return registersAsHost || registry.hosts === 0;
    },
  };
};
