import type { IconDef } from "../../components/icons";

/**
 * Parametric icons of the React version (`<ArrowheadNoneIcon flip />`,
 * `<TextAlignTopIcon theme />`) are expected to be exposed by
 * `components/icons.ts` either as a plain `IconDef` or as a factory
 * `(props) => IconDef`. This resolves both forms.
 */
export const resolveIcon = <P>(
  icon: IconDef | ((props: P) => IconDef),
  props: P,
): IconDef => (typeof icon === "function" ? icon(props) : icon);
