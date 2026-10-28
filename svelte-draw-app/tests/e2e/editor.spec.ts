import fs from "node:fs";

import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

type Hook = {
  elements: { type: string; isDeleted: boolean; x: number; y: number }[];
  state: { isLoading: boolean; activeTool: { type: string } };
};

const liveElements = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { h: Hook }).h.elements
      .filter((el) => !el.isDeleted)
      .map((el) => el.type),
  );

const drawShape = async (
  page: Page,
  key: string,
  from: [number, number],
  to: [number, number],
) => {
  await page.keyboard.press(key);
  await page.mouse.move(...from);
  await page.mouse.down();
  await page.mouse.move(to[0], to[1], { steps: 8 });
  await page.mouse.up();
};

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(
    () => (window as unknown as { h?: Hook }).h?.state?.isLoading === false,
  );
});

test("page identity", async ({ page }) => {
  await expect(page).toHaveTitle("svelte-draw");
  await expect(page.locator("canvas.interactive")).toBeVisible();
  await expect(page.locator("canvas.static")).toBeAttached();
});

test("draws shapes, undo and redo", async ({ page }) => {
  await drawShape(page, "r", [300, 300], [480, 400]);
  await drawShape(page, "o", [560, 300], [740, 420]);
  expect(await liveElements(page)).toEqual(["rectangle", "ellipse"]);

  await page.keyboard.press("ControlOrMeta+z");
  expect(await liveElements(page)).toEqual(["rectangle"]);

  await page.keyboard.press("ControlOrMeta+Shift+z");
  expect(await liveElements(page)).toEqual(["rectangle", "ellipse"]);
});

test("selects and moves an element", async ({ page }) => {
  await drawShape(page, "r", [300, 300], [480, 400]);
  const before = await page.evaluate(
    () => (window as unknown as { h: Hook }).h.elements[0].x,
  );
  await page.keyboard.press("v");
  await page.mouse.move(380, 350);
  await page.mouse.down();
  await page.mouse.move(480, 350, { steps: 8 });
  await page.mouse.up();
  const after = await page.evaluate(
    () => (window as unknown as { h: Hook }).h.elements[0].x,
  );
  expect(after).toBeGreaterThan(before + 50);
});

test("the drawing survives a reload (local persistence)", async ({ page }) => {
  await drawShape(page, "r", [300, 300], [480, 400]);
  // saving is debounced
  await page.waitForFunction(
    () => !!localStorage.getItem("excalidraw"),
    undefined,
    { timeout: 10_000 },
  );
  await page.reload();
  await page.waitForFunction(
    () => (window as unknown as { h?: Hook }).h?.state?.isLoading === false,
  );
  expect(await liveElements(page)).toEqual(["rectangle"]);
});

test("exports a scene file and imports it back", async ({ page }) => {
  // Chrome would open its native save picker (no download event); without the
  // File System Access API the app falls back to a regular file download
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).showSaveFilePicker;
    delete (window as unknown as Record<string, unknown>).showOpenFilePicker;
  });
  await page.reload();
  await page.waitForFunction(
    () => (window as unknown as { h?: Hook }).h?.state?.isLoading === false,
  );
  await drawShape(page, "d", [300, 300], [440, 440]);

  // open the main menu and save to a file
  await page.locator(".dropdown-menu-button").first().click();
  await page.getByTestId("json-export-button").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator(".Card-button").first().click();
  const download = await downloadPromise;
  const file = await download.path();
  const scene = JSON.parse(fs.readFileSync(file!, "utf8"));
  expect(scene.type).toBe("excalidraw");
  expect(scene.elements.some((el: { type: string }) => el.type === "diamond")).toBe(true);

  // clear the scene, then import the file through the open dialog
  await page.evaluate(() =>
    (window as unknown as { h: { app: { resetScene: () => void } } }).h.app.resetScene(),
  );
  expect(await liveElements(page)).toEqual([]);

  const chooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("ControlOrMeta+o");
  const chooser = await chooserPromise;
  await chooser.setFiles(file!);
  await page.waitForFunction(
    () =>
      (window as unknown as { h: Hook }).h.elements.some(
        (el) => el.type === "diamond" && !el.isDeleted,
      ),
  );
  expect(await liveElements(page)).toEqual(["diamond"]);
});
