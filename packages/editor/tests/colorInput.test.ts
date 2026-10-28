import { fireEvent, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";

import { normalizeInputColor } from "@svelte-draw/common";

import { editorJotaiStore } from "../editor-jotai";
import { activeColorPickerSectionAtom } from "../components/ColorPicker/colorPickerUtils";
import ColorInputHarness from "../components/ColorPicker/ColorInputHarness.test.svelte";
import {
  createFakeEditorContext,
  renderWithEditorContext,
} from "../components/overlayTestUtils";

describe("normalizeInputColor", () => {
  describe("hex colors", () => {
    it("returns hex color with hash as-is", () => {
      expect(normalizeInputColor("#ff0000")).toBe("#ff0000");
      expect(normalizeInputColor("#FF0000")).toBe("#FF0000");
      expect(normalizeInputColor("#abc")).toBe("#abc");
      expect(normalizeInputColor("#ABC")).toBe("#ABC");
    });

    it("adds hash to hex color without hash", () => {
      expect(normalizeInputColor("ff0000")).toBe("#ff0000");
      expect(normalizeInputColor("FF0000")).toBe("#FF0000");
      expect(normalizeInputColor("abc")).toBe("#abc");
      expect(normalizeInputColor("ABC")).toBe("#ABC");
    });

    it("handles 8-digit hex (hexa) with alpha", () => {
      expect(normalizeInputColor("#ff000080")).toBe("#ff000080");
      expect(normalizeInputColor("#ff0000ff")).toBe("#ff0000ff");
    });

    it("does NOT add hash to hexa without hash (tinycolor detects as hex8, not hex)", () => {
      // Note: tinycolor detects 8-digit hex as "hex8" format, not "hex"
      expect(normalizeInputColor("ff000080")).toBe("#ff000080");
    });
  });

  describe("named colors", () => {
    it("returns named colors as-is", () => {
      expect(normalizeInputColor("red")).toBe("red");
      expect(normalizeInputColor("blue")).toBe("blue");
      expect(normalizeInputColor("green")).toBe("green");
      expect(normalizeInputColor("white")).toBe("white");
      expect(normalizeInputColor("black")).toBe("black");
      expect(normalizeInputColor("transparent")).toBe("transparent");
    });

    it("handles case variations of named colors", () => {
      expect(normalizeInputColor("RED")).toBe("RED");
      expect(normalizeInputColor("Red")).toBe("Red");
    });
  });

  describe("rgb/rgba colors", () => {
    it("returns rgb colors as-is", () => {
      expect(normalizeInputColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(normalizeInputColor("rgb(0,0,0)")).toBe("rgb(0,0,0)");
    });

    // NOTE: tinycolor clamps values, so rgb(256, 0, 0) is treated as valid
    it("tinycolor considers out-of-range rgb values as valid (clamped)", () => {
      expect(normalizeInputColor("rgb(256, 0, 0)")).toBe("rgb(256, 0, 0)");
    });

    it("returns rgba colors as-is", () => {
      expect(normalizeInputColor("rgba(255, 0, 0, 0.5)")).toBe(
        "rgba(255, 0, 0, 0.5)",
      );
      expect(normalizeInputColor("rgba(0,0,0,1)")).toBe("rgba(0,0,0,1)");
    });
  });

  describe("hsl/hsla colors", () => {
    it("returns hsl colors as-is", () => {
      expect(normalizeInputColor("hsl(0, 100%, 50%)")).toBe(
        "hsl(0, 100%, 50%)",
      );
    });

    it("returns hsla colors as-is", () => {
      expect(normalizeInputColor("hsla(0, 100%, 50%, 0.5)")).toBe(
        "hsla(0, 100%, 50%, 0.5)",
      );
    });
  });

  describe("whitespace handling", () => {
    it("trims leading whitespace", () => {
      expect(normalizeInputColor("  #ff0000")).toBe("#ff0000");
      expect(normalizeInputColor("  red")).toBe("red");
    });

    it("trims trailing whitespace", () => {
      expect(normalizeInputColor("#ff0000  ")).toBe("#ff0000");
      expect(normalizeInputColor("red  ")).toBe("red");
    });

    it("trims both leading and trailing whitespace", () => {
      expect(normalizeInputColor("  #ff0000  ")).toBe("#ff0000");
      expect(normalizeInputColor("  red  ")).toBe("red");
    });

    it("adds hash to trimmed hex without hash", () => {
      expect(normalizeInputColor("  ff0000  ")).toBe("#ff0000");
    });
  });

  describe("invalid colors", () => {
    it("returns null for invalid color strings", () => {
      expect(normalizeInputColor("notacolor")).toBe(null);
      expect(normalizeInputColor("gggggg")).toBe(null);
      expect(normalizeInputColor("#gggggg")).toBe(null);
      expect(normalizeInputColor("")).toBe(null);
      expect(normalizeInputColor("   ")).toBe(null);
    });

    it("returns null for partial/malformed colors", () => {
      expect(normalizeInputColor("#ff")).toBe(null);
      expect(normalizeInputColor("rgb(")).toBe(null);
    });
  });
});

describe("ColorInput error handling", () => {
  beforeEach(() => {
    editorJotaiStore.set(activeColorPickerSectionAtom, null);
  });

  const openCanvasBackgroundColorPicker = async () => {
    const { ctx } = createFakeEditorContext();
    // the canvas background picker's hex input, bound to a color state
    const { container } = renderWithEditorContext(
      ColorInputHarness,
      {
        initialColor: "#ffffff",
        label: "Canvas background",
        colorPickerType: "canvasBackground",
        placeholder: "Color",
      },
      ctx,
    );

    await waitFor(() => {
      const colorInput = container.querySelector(
        ".color-picker-input",
      ) as HTMLInputElement;
      expect(colorInput).toBeTruthy();
    });

    return container.querySelector(".color-picker-input") as HTMLInputElement;
  };

  it("shows error for invalid hex length (too short)", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid hex code with length 1
    fireEvent.input(colorInput, { target: { value: "1" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain(
        "Hex code must be 3, 4, 6, or 8 characters",
      );
    });
  });

  it("shows error for invalid hex length (too long)", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid hex code with length 9
    fireEvent.input(colorInput, { target: { value: "123456789" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain(
        "Hex code must be 3, 4, 6, or 8 characters",
      );
    });
  });

  it("shows generic error for non-hex-shaped invalid input", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid input that isn't hex-shaped
    fireEvent.input(colorInput, { target: { value: "zzzzzz" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain("Not a valid color");
    });
  });

  it("shows generic error for unrecognized color names", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter non-hex text (not a valid color name)
    fireEvent.input(colorInput, { target: { value: "notacolor" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
      expect(errorMessage.textContent).toContain("Not a valid color");
    });
  });

  it("does not show an error for a complete named color", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    fireEvent.input(colorInput, { target: { value: "transparent" } });

    await waitFor(() => {
      expect(colorInput.value).toBe("transparent");
      expect(
        document.querySelector(".color-picker__error-message"),
      ).toBeFalsy();
    });
  });

  it("does not show an error for valid rgb() input", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    fireEvent.input(colorInput, { target: { value: "rgb(255, 0, 0)" } });

    await waitFor(() => {
      expect(
        document.querySelector(".color-picker__error-message"),
      ).toBeFalsy();
    });
  });

  it("does not show error for valid hex codes", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter valid hex code
    fireEvent.input(colorInput, { target: { value: "ff0000" } });

    // Check no error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeFalsy();
    });
  });

  it("clears error when input is cleared", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid hex code to trigger error
    fireEvent.input(colorInput, { target: { value: "notacolor" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
    });

    // Clear input
    fireEvent.input(colorInput, { target: { value: "" } });

    // Check error message disappears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeFalsy();
    });
  });

  it("clears error when blurring input", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid hex code to trigger error
    fireEvent.input(colorInput, { target: { value: "notacolor" } });

    // Check error message appears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeTruthy();
    });

    // Blur input (simulate clicking outside)
    fireEvent.blur(colorInput);

    // Check error message disappears
    await waitFor(() => {
      const errorMessage = document.querySelector(
        ".color-picker__error-message",
      ) as HTMLElement;
      expect(errorMessage).toBeFalsy();
    });
  });

  it("keeps the typed value when editing a valid color", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    fireEvent.input(colorInput, { target: { value: "ff0000" } });
    await waitFor(() => {
      expect(colorInput.value).toBe("ff0000");
    });

    // deleting a char makes it invalid, but must not be reverted
    fireEvent.input(colorInput, { target: { value: "ff000" } });
    await waitFor(() => {
      expect(colorInput.value).toBe("ff000");
      expect(
        document.querySelector(".color-picker__error-message"),
      ).toBeTruthy();
    });

    // retyping it resolves to the color we're already at, so the `color` prop
    // doesn't change — the input must still show what was typed
    fireEvent.input(colorInput, { target: { value: "ff0000" } });
    await waitFor(() => {
      expect(colorInput.value).toBe("ff0000");
      expect(
        document.querySelector(".color-picker__error-message"),
      ).toBeFalsy();
    });
  });

  it("can delete a valid color down to an empty input", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    fireEvent.input(colorInput, { target: { value: "1e9df0" } });
    await waitFor(() => {
      expect(colorInput.value).toBe("1e9df0");
    });

    for (const value of ["1e9df", "1e9d", "1e9", "1e", "1", ""]) {
      fireEvent.input(colorInput, { target: { value } });
      await waitFor(() => {
        expect(colorInput.value).toBe(value);
      });
    }

    expect(document.querySelector(".color-picker__error-message")).toBeFalsy();
  });

  it("input has aria-invalid attribute when error is shown", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter invalid hex code to trigger error
    fireEvent.input(colorInput, { target: { value: "notacolor" } });

    // Check aria-invalid attribute is set to true
    await waitFor(() => {
      expect(colorInput.getAttribute("aria-invalid")).toBe("true");
    });
  });

  it("input has aria-invalid attribute set to false when no error", async () => {
    const colorInput = await openCanvasBackgroundColorPicker();

    // Enter valid hex code
    fireEvent.input(colorInput, { target: { value: "ff0000" } });

    // Check aria-invalid attribute is set to false
    await waitFor(() => {
      expect(colorInput.getAttribute("aria-invalid")).toBe("false");
    });
  });
});
