import { render } from "@testing-library/svelte";

import InlineIcon from "./InlineIcon.svelte";
import { slashIcon } from "./icons";

describe("InlineIcon", () => {
  it("renders a styled span wrapping the icon svg", () => {
    const { container } = render(InlineIcon, {
      icon: slashIcon,
      class: "foo",
    });
    const span = container.firstElementChild as HTMLElement;
    expect(span.tagName).toBe("SPAN");
    expect(span).toHaveClass("foo");
    expect(span.style.width).toBe("1em");
    expect(span.style.height).toBe("100%");
    expect(span.style.margin).toBe("0px 0.5ex");
    expect(span.style.display).toBe("inline-flex");
    expect(span.style.lineHeight).toBe("0");
    expect(span.style.verticalAlign).toBe("middle");
    expect(span.style.flex).toBe("0 0 auto");
    expect(span.children).toHaveLength(1);
    expect(span.firstElementChild!.tagName.toLowerCase()).toBe("svg");
  });

  it("honours the size prop", () => {
    const { container } = render(InlineIcon, { icon: slashIcon, size: "2rem" });
    expect((container.firstElementChild as HTMLElement).style.width).toBe(
      "2rem",
    );
  });
});
