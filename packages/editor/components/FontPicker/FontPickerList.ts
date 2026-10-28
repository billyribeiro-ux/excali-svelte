import { FONT_FAMILY } from "@svelte-draw/common";

import type { ValueOf } from "@svelte-draw/common/utility-types";
import type { FontFamilyValues } from "@svelte-draw/element/types";

import {
  FontFamilyCodeIcon,
  FontFamilyHeadingIcon,
  FontFamilyNormalIcon,
  FreedrawIcon,
} from "../icons";

import type { IconDef } from "../icons";
import type { DropDownMenuItemBadgeType } from "../dropdownMenu/common";
import type { ExcalidrawFontFace } from "../../fonts/ExcalidrawFontFace";

export interface FontDescriptor {
  value: number;
  icon: IconDef;
  text: string;
  deprecated?: true;
  badge?: {
    type: ValueOf<typeof DropDownMenuItemBadgeType>;
    placeholder: string;
  };
}

export const getFontFamilyIcon = (fontFamily: FontFamilyValues): IconDef => {
  switch (fontFamily) {
    case FONT_FAMILY.Excalifont:
    case FONT_FAMILY.Virgil:
      return FreedrawIcon;
    case FONT_FAMILY.Nunito:
    case FONT_FAMILY.Helvetica:
      return FontFamilyNormalIcon;
    case FONT_FAMILY["Lilita One"]:
      return FontFamilyHeadingIcon;
    case FONT_FAMILY["Comic Shanns"]:
    case FONT_FAMILY.Cascadia:
      return FontFamilyCodeIcon;
    default:
      return FontFamilyNormalIcon;
  }
};

export const getFontFamilyLabel = (
  fontFamily: FontFamilyValues,
  fontFaces: ExcalidrawFontFace[],
) =>
  // prefer our config as the browser resolved names may be wrapped in quotes and such
  Object.entries(FONT_FAMILY).find(([, id]) => id === fontFamily)?.[0] ??
  fontFaces[0]?.fontFace?.family ??
  "Unknown";
