import { describe, expect, it } from "vitest";

import { defaultLang, languages } from "@svelte-draw/editor/i18n";
import { UI } from "@svelte-draw/editor/tests/helpers/ui";
import {
  screen,
  fireEvent,
  waitFor,
  render,
} from "@svelte-draw/editor/tests/test-utils";

import LanguageListHarness from "./LanguageListHarness.test.svelte";

const TEST_LANG_CODE = "fr-FR";

describe("Test LanguageList", () => {
  it("rerenders UI on language change", async () => {
    expect(languages.some((lang) => lang.code === TEST_LANG_CODE)).toBe(true);

    await render(LanguageListHarness);

    // select rectangle tool to show properties menu
    UI.clickTool("rectangle");
    // english lang should display `thin` label
    expect(screen.queryByTitle(/thin/i)).not.toBeNull();
    fireEvent.click(document.querySelector(".dropdown-menu-button")!);

    fireEvent.change(document.querySelector(".dropdown-select__language")!, {
      target: { value: TEST_LANG_CODE },
    });
    // switching to French, `thin` label should no longer exist
    await waitFor(() => expect(screen.queryByTitle(/thin/i)).toBeNull());
    // reset language
    fireEvent.change(document.querySelector(".dropdown-select__language")!, {
      target: { value: defaultLang.code },
    });
    // switching back to English
    await waitFor(() => expect(screen.queryByTitle(/thin/i)).not.toBeNull());
  });
});
