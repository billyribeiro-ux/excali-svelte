import type { Snippet } from "svelte";

export type RangeProps = {
  label: string | Snippet;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string | number | Snippet;
  hasCommonValue?: boolean;
  testId?: string;
};
