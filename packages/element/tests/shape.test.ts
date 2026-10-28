import { API } from "@svelte-draw/editor/tests/helpers/api";
import { pointFrom } from "@svelte-draw/math";

import type { LocalPoint } from "@svelte-draw/math";

import { ShapeCache } from "../src/shape";

import type { Op } from "roughjs/bin/core";

describe("arrowhead shapes", () => {
  it.each(["triangle", "diamond_outline", "circle"] as const)(
    "fills %s arrowheads along their outline",
    (arrowhead) => {
      const arrow = API.createElement({
        type: "arrow",
        points: [pointFrom<LocalPoint>(0, 0), pointFrom<LocalPoint>(100, 0)],
        endArrowhead: arrowhead,
        roughness: 2,
      });
      const [, head] = ShapeCache.generateElementShape(arrow, null);
      const [fill, outline] = head.sets;
      const getCurves = (ops: Op[]) =>
        ops.filter((op) => op.op === "bcurveTo").map((op) => op.data);

      expect(fill.type).toBe("fillPath");
      expect(outline.type).toBe("path");
      // the fill only joins up the outline's curves
      expect(getCurves(fill.ops)).toEqual(getCurves(outline.ops));
    },
  );
});
