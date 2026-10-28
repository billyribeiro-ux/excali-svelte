import { screen } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/svelte";
import { act } from "./test-utils";
import { vi } from "vitest";

import { getDefaultAppState } from "../appState";
import { AppStateObserver } from "../components/AppStateObserver";

import AppStateHooksHarness from "./appStateHooksHarness.test.svelte";

import type { AppState, SvelteDrawAPI } from "../types";

const createAppState = (): AppState => ({
  ...getDefaultAppState(),
  width: 0,
  height: 0,
  offsetLeft: 0,
  offsetTop: 0,
});

const createMockAPI = (initialState: AppState) => {
  let state = initialState;
  const observer = new AppStateObserver(() => state);

  return {
    api: {
      isDestroyed: false,
      getAppState: () => state,
      onStateChange: observer.onStateChange,
    } as Pick<
      SvelteDrawAPI,
      "isDestroyed" | "getAppState" | "onStateChange"
    > as SvelteDrawAPI,
    updateAppState: (partial: Partial<AppState>) => {
      const prevState = state;
      state = { ...state, ...partial };
      observer.flush(prevState);
    },
  };
};

describe("app state hooks", () => {
  afterEach(() => {
    cleanup();
  });

  it("useAppStateValue rerenders when the selected value changes", () => {
    const renderSpy = vi.fn();
    const { api, updateAppState } = createMockAPI(createAppState());

    render(AppStateHooksHarness, {
      props: { api, hook: "useAppStateValue", renderSpy },
    });

    expect(screen.getByTestId("value").textContent).toBe("false");
    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      updateAppState({ viewModeEnabled: true });
    });

    expect(screen.getByTestId("value").textContent).toBe("true");
    expect(renderSpy).toHaveBeenCalledTimes(2);
  });

  it("useOnAppStateChange notifies without rerendering", () => {
    const renderSpy = vi.fn();
    const callback = vi.fn();
    const { api, updateAppState } = createMockAPI(createAppState());

    render(AppStateHooksHarness, {
      props: { api, hook: "useOnAppStateChange", renderSpy, callback },
    });

    expect(screen.getByTestId("value").textContent).toBe("undefined");
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ viewModeEnabled: false }),
    );

    act(() => {
      updateAppState({ viewModeEnabled: true });
    });

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(
      true,
      expect.objectContaining({ viewModeEnabled: true }),
    );
  });
});
