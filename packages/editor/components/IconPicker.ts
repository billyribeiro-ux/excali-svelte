import { atom } from "../editor-jotai";

import type { IconDef } from "./icons";

export const moreOptionsAtom = atom(false);
export const PICKER_COLUMNS = 4;
export const DEFAULT_SECTION_NAME = "default";

export type Option<T> = {
  value: T;
  text: string;
  icon: IconDef;
  keyBinding: string | null;
};

export type PickerSection<T> = {
  name: string;
  options: readonly Option<T>[];
};

export const flattenOptions = <T>(sections: readonly PickerSection<T>[]) =>
  sections.flatMap((section) => section.options);

export const findOption = <T>(
  sections: readonly PickerSection<T>[],
  predicate: (option: Option<T>) => boolean,
) => {
  for (const section of sections) {
    const option = section.options.find(predicate);
    if (option) {
      return option;
    }
  }

  return null;
};

export const hasOption = <T>(
  sections: readonly PickerSection<T>[],
  predicate: (option: Option<T>) => boolean,
) => sections.some((section) => section.options.some(predicate));

export const getNavigationRows = <T>(sections: readonly PickerSection<T>[]) =>
  sections.flatMap((section) =>
    Array.from(
      { length: Math.ceil(section.options.length / PICKER_COLUMNS) },
      (_, index) =>
        section.options.slice(
          index * PICKER_COLUMNS,
          index * PICKER_COLUMNS + PICKER_COLUMNS,
        ),
    ),
  );
