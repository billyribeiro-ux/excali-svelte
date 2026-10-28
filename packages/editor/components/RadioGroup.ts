import type { IconDef } from "./icons";

export type RadioGroupChoice<T> = {
  value: T;
  label: string | IconDef;
  ariaLabel?: string;
};

export type RadioGroupProps<T> = {
  choices: RadioGroupChoice<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
};
