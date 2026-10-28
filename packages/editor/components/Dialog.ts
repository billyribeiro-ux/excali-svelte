export type DialogSize = number | "small" | "regular" | "wide" | undefined;

export const getDialogSize = (size: DialogSize): number => {
  if (size && typeof size === "number") {
    return size;
  }

  switch (size) {
    case "small":
      return 550;
    case "wide":
      return 1024;
    case "regular":
    default:
      return 800;
  }
};
