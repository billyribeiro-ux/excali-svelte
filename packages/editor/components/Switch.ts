export type SwitchProps = {
  name: string;
  checked: boolean;
  title?: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};
