import { t } from "../../i18n";
import {
  ArrowheadArrowIcon,
  ArrowheadBarIcon,
  ArrowheadCircleIcon,
  ArrowheadTriangleIcon,
  ArrowheadNoneIcon,
  ArrowheadTriangleOutlineIcon,
  ArrowheadCircleOutlineIcon,
  ArrowheadDiamondIcon,
  ArrowheadDiamondOutlineIcon,
  ArrowheadCardinalityExactlyOneIcon,
  ArrowheadCardinalityManyIcon,
  ArrowheadCardinalityOneIcon,
  ArrowheadCardinalityOneOrManyIcon,
  ArrowheadCardinalityZeroOrManyIcon,
  ArrowheadCardinalityZeroOrOneIcon,
} from "../../components/icons";

import { resolveIcon } from "./propertiesIcons";

export const getArrowheadOptions = (flip: boolean) => {
  const p = { flip };
  return {
    visibleSections: [
      {
        name: "default",
        options: [
          {
            value: null,
            text: t("labels.arrowhead_none"),
            keyBinding: "q",
            icon: resolveIcon(ArrowheadNoneIcon, p),
          },
          {
            value: "arrow",
            text: t("labels.arrowhead_arrow"),
            keyBinding: "w",
            icon: resolveIcon(ArrowheadArrowIcon, p),
          },
          {
            value: "triangle",
            text: t("labels.arrowhead_triangle"),
            icon: resolveIcon(ArrowheadTriangleIcon, p),
            keyBinding: "e",
          },
          {
            value: "triangle_outline",
            text: t("labels.arrowhead_triangle_outline"),
            icon: resolveIcon(ArrowheadTriangleOutlineIcon, p),
            keyBinding: "r",
          },
        ],
      },
    ],
    hiddenSections: [
      {
        name: "default",
        options: [
          {
            value: "circle",
            text: t("labels.arrowhead_circle"),
            keyBinding: "a",
            icon: resolveIcon(ArrowheadCircleIcon, p),
          },
          {
            value: "circle_outline",
            text: t("labels.arrowhead_circle_outline"),
            keyBinding: "s",
            icon: resolveIcon(ArrowheadCircleOutlineIcon, p),
          },
          {
            value: "diamond",
            text: t("labels.arrowhead_diamond"),
            icon: resolveIcon(ArrowheadDiamondIcon, p),
            keyBinding: "d",
          },
          {
            value: "diamond_outline",
            text: t("labels.arrowhead_diamond_outline"),
            icon: resolveIcon(ArrowheadDiamondOutlineIcon, p),
            keyBinding: "f",
          },
          {
            value: "bar",
            text: t("labels.arrowhead_bar"),
            keyBinding: "z",
            icon: resolveIcon(ArrowheadBarIcon, p),
          },
        ],
      },
      {
        name: t("labels.cardinality"),
        options: [
          {
            value: "cardinality_one",
            text: t("labels.arrowhead_cardinality_one"),
            icon: resolveIcon(ArrowheadCardinalityOneIcon, p),
            keyBinding: "x",
          },
          {
            value: "cardinality_many",
            text: t("labels.arrowhead_cardinality_many"),
            icon: resolveIcon(ArrowheadCardinalityManyIcon, p),
            keyBinding: "c",
          },
          {
            value: "cardinality_one_or_many",
            text: t("labels.arrowhead_cardinality_one_or_many"),
            icon: resolveIcon(ArrowheadCardinalityOneOrManyIcon, p),
            keyBinding: "v",
          },
          {
            value: "cardinality_exactly_one",
            text: t("labels.arrowhead_cardinality_exactly_one"),
            icon: resolveIcon(ArrowheadCardinalityExactlyOneIcon, p),
            keyBinding: null,
          },
          {
            value: "cardinality_zero_or_one",
            text: t("labels.arrowhead_cardinality_zero_or_one"),
            icon: resolveIcon(ArrowheadCardinalityZeroOrOneIcon, p),
            keyBinding: null,
          },
          {
            value: "cardinality_zero_or_many",
            text: t("labels.arrowhead_cardinality_zero_or_many"),
            icon: resolveIcon(ArrowheadCardinalityZeroOrManyIcon, p),
            keyBinding: null,
          },
        ],
      },
    ],
  } as const;
};
