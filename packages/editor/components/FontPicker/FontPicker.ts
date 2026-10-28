import { FONT_FAMILY, FONT_TOP_PICKS_SLOTS } from "@svelte-draw/common";

import type { FontFamilyValues } from "@svelte-draw/element/types";

import { Fonts } from "../../fonts";
import { t } from "../../i18n";
import {
  FontFamilyCodeIcon,
  FontFamilyNormalIcon,
  FreedrawIcon,
} from "../icons";

import { getFontFamilyIcon, getFontFamilyLabel } from "./FontPickerList";

// length must equal FONT_TOP_PICKS_SLOTS (enforced by fontTopPicks.test.ts)
export const DEFAULT_FONTS = [
  {
    value: FONT_FAMILY.Excalifont,
    icon: FreedrawIcon,
    text: t("labels.handDrawn"),
    testId: "font-family-hand-drawn",
  },
  {
    value: FONT_FAMILY.Nunito,
    icon: FontFamilyNormalIcon,
    text: t("labels.normal"),
    testId: "font-family-normal",
  },
  {
    value: FONT_FAMILY["Comic Shanns"],
    icon: FontFamilyCodeIcon,
    text: t("labels.code"),
    testId: "font-family-code",
  },
];

export const DEFAULT_FONT_TOP_PICKS = DEFAULT_FONTS.map((font) => font.value);

const defaultFontFamilies = new Set(DEFAULT_FONT_TOP_PICKS);

export const getFontTopPicks = (
  topPicks: readonly FontFamilyValues[],
): readonly FontFamilyValues[] => {
  const picks = [...new Set(topPicks)].slice(0, FONT_TOP_PICKS_SLOTS);
  for (const fontFamily of DEFAULT_FONT_TOP_PICKS) {
    if (picks.length >= FONT_TOP_PICKS_SLOTS) {
      break;
    }
    if (!picks.includes(fontFamily)) {
      picks.push(fontFamily);
    }
  }
  return picks;
};

export const isDefaultFont = (fontFamily: number | null) => {
  if (!fontFamily) {
    return false;
  }

  return defaultFontFamilies.has(fontFamily);
};

export const getTopPickFont = (fontFamily: FontFamilyValues) =>
  DEFAULT_FONTS.find((font) => font.value === fontFamily) ?? {
    value: fontFamily,
    icon: getFontFamilyIcon(fontFamily),
    text: getFontFamilyLabel(
      fontFamily,
      Fonts.registered.get(fontFamily)?.fontFaces ?? [],
    ),
    testId: `font-family-${fontFamily}`,
  };

export const needsGlyphSample = (
  fontFamily: FontFamilyValues,
  picks: readonly FontFamilyValues[],
) => {
  if (defaultFontFamilies.has(fontFamily)) {
    return false;
  }
  const icon = getFontFamilyIcon(fontFamily);
  return picks.some(
    (pick) => pick !== fontFamily && getTopPickFont(pick).icon === icon,
  );
};
