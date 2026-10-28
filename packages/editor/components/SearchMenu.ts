import debounce from "lodash.debounce";

import { FONT_FAMILY, FRAME_STYLE, getLineHeight } from "@svelte-draw/common";

import { getFontString } from "@svelte-draw/common";

import { measureText } from "@svelte-draw/element";
import { isTextElement, isFrameLikeElement } from "@svelte-draw/element";

import { getDefaultFrameName } from "@svelte-draw/element/frame";

import type { RenderEnvironment } from "@svelte-draw/element";
import type {
  ExcalidrawFrameLikeElement,
  ExcalidrawTextElement,
} from "@svelte-draw/element/types";

import { atom } from "../editor-jotai";

import type { AppClassProperties, SearchMatch } from "../types";

export const searchQueryAtom = atom<string>("");
export const searchItemInFocusAtom = atom<number | null>(null);

export const SEARCH_DEBOUNCE = 350;

export type SearchMatchItem = {
  element: ExcalidrawTextElement | ExcalidrawFrameLikeElement;
  searchQuery: SearchQuery;
  index: number;
  preview: {
    indexInSearchQuery: number;
    previewText: string;
    moreBefore: boolean;
    moreAfter: boolean;
  };
  matchedLines: SearchMatch["matchedLines"];
};

export type SearchMatches = {
  nonce: number | null;
  items: SearchMatchItem[];
};

export type SearchQuery = string & { _brand: "SearchQuery" };

export const getMatchPreview = (
  text: string,
  index: number,
  searchQuery: SearchQuery,
) => {
  const WORDS_BEFORE = 2;
  const WORDS_AFTER = 5;

  const substrBeforeQuery = text.slice(0, index);
  const wordsBeforeQuery = substrBeforeQuery.split(/\s+/);
  // text = "small", query = "mall", not complete before
  // text = "small", query = "smal", complete before
  const isQueryCompleteBefore = substrBeforeQuery.endsWith(" ");
  const startWordIndex =
    wordsBeforeQuery.length -
    WORDS_BEFORE -
    1 -
    (isQueryCompleteBefore ? 0 : 1);
  let wordsBeforeAsString =
    wordsBeforeQuery.slice(startWordIndex <= 0 ? 0 : startWordIndex).join(" ") +
    (isQueryCompleteBefore ? " " : "");

  const MAX_ALLOWED_CHARS = 20;

  wordsBeforeAsString =
    wordsBeforeAsString.length > MAX_ALLOWED_CHARS
      ? wordsBeforeAsString.slice(-MAX_ALLOWED_CHARS)
      : wordsBeforeAsString;

  const substrAfterQuery = text.slice(index + searchQuery.length);
  const wordsAfter = substrAfterQuery.split(/\s+/);
  // text = "small", query = "mall", complete after
  // text = "small", query = "smal", not complete after
  const isQueryCompleteAfter = !substrAfterQuery.startsWith(" ");
  const numberOfWordsToTake = isQueryCompleteAfter
    ? WORDS_AFTER + 1
    : WORDS_AFTER;
  const wordsAfterAsString =
    (isQueryCompleteAfter ? "" : " ") +
    wordsAfter.slice(0, numberOfWordsToTake).join(" ");

  return {
    indexInSearchQuery: wordsBeforeAsString.length,
    previewText: wordsBeforeAsString + searchQuery + wordsAfterAsString,
    moreBefore: startWordIndex > 0,
    moreAfter: wordsAfter.length > numberOfWordsToTake,
  };
};

const normalizeWrappedText = (
  wrappedText: string,
  originalText: string,
): string => {
  const wrappedLines = wrappedText.split("\n");
  const normalizedLines: string[] = [];
  let originalIndex = 0;

  for (let i = 0; i < wrappedLines.length; i++) {
    let currentLine = wrappedLines[i];
    const nextLine = wrappedLines[i + 1];

    if (nextLine) {
      const nextLineIndexInOriginal = originalText.indexOf(
        nextLine,
        originalIndex,
      );

      if (nextLineIndexInOriginal > currentLine.length + originalIndex) {
        let j = nextLineIndexInOriginal - (currentLine.length + originalIndex);

        while (j > 0) {
          currentLine += " ";
          j--;
        }
      }
    }

    normalizedLines.push(currentLine);
    originalIndex = originalIndex + currentLine.length;
  }

  return normalizedLines.join("\n");
};

const getMatchedLines = (
  textElement: ExcalidrawTextElement,
  searchQuery: SearchQuery,
  index: number,
  renderEnvironment?: RenderEnvironment,
) => {
  const normalizedText = normalizeWrappedText(
    textElement.text,
    textElement.originalText,
  );

  const lines = normalizedText.split("\n");

  const lineIndexRanges = [];
  let currentIndex = 0;
  let lineNumber = 0;

  for (const line of lines) {
    const startIndex = currentIndex;
    const endIndex = startIndex + line.length - 1;

    lineIndexRanges.push({
      line,
      startIndex,
      endIndex,
      lineNumber,
    });

    // Move to the next line's start index
    currentIndex = endIndex + 1;
    lineNumber++;
  }

  let startIndex = index;
  let remainingQuery = textElement.originalText.slice(
    index,
    index + searchQuery.length,
  );
  const matchedLines: SearchMatch["matchedLines"] = [];

  for (const lineIndexRange of lineIndexRanges) {
    if (remainingQuery === "") {
      break;
    }

    if (
      startIndex >= lineIndexRange.startIndex &&
      startIndex <= lineIndexRange.endIndex
    ) {
      const matchCapacity = lineIndexRange.endIndex + 1 - startIndex;
      const textToStart = lineIndexRange.line.slice(
        0,
        startIndex - lineIndexRange.startIndex,
      );

      const matchedWord = remainingQuery.slice(0, matchCapacity);
      remainingQuery = remainingQuery.slice(matchCapacity);

      const offset = measureText(
        textToStart,
        getFontString(textElement),
        textElement.lineHeight,
        renderEnvironment,
      );

      // measureText returns a non-zero width for the empty string
      // which is not what we're after here, hence the check and the correction
      if (textToStart === "") {
        offset.width = 0;
      }

      if (textElement.textAlign !== "left" && lineIndexRange.line.length > 0) {
        const lineLength = measureText(
          lineIndexRange.line,
          getFontString(textElement),
          textElement.lineHeight,
          renderEnvironment,
        );

        const spaceToStart =
          textElement.textAlign === "center"
            ? (textElement.width - lineLength.width) / 2
            : textElement.width - lineLength.width;
        offset.width += spaceToStart;
      }

      const { width, height } = measureText(
        matchedWord,
        getFontString(textElement),
        textElement.lineHeight,
        renderEnvironment,
      );

      const offsetX = offset.width;
      const offsetY = lineIndexRange.lineNumber * offset.height;

      matchedLines.push({
        offsetX,
        offsetY,
        width,
        height,
        showOnCanvas: true,
      });

      startIndex += matchCapacity;
    }
  }

  return matchedLines;
};

const getMatchInFrame = (
  frame: ExcalidrawFrameLikeElement,
  searchQuery: SearchQuery,
  index: number,
  zoomValue: number,
  renderEnvironment?: RenderEnvironment,
): SearchMatch["matchedLines"] => {
  const text = frame.name ?? getDefaultFrameName(frame);
  const matchedText = text.slice(index, index + searchQuery.length);

  const prefixText = text.slice(0, index);
  const font = getFontString({
    fontSize: FRAME_STYLE.nameFontSize,
    fontFamily: FONT_FAMILY.Assistant,
  });

  const lineHeight = getLineHeight(FONT_FAMILY.Assistant);

  const offset = measureText(prefixText, font, lineHeight, renderEnvironment);

  // Correct non-zero width for empty string
  if (prefixText === "") {
    offset.width = 0;
  }

  const matchedMetrics = measureText(
    matchedText,
    font,
    lineHeight,
    renderEnvironment,
  );

  const offsetX = offset.width;
  const offsetY = -offset.height - FRAME_STYLE.strokeWidth;
  const width = matchedMetrics.width;

  return [
    {
      offsetX,
      offsetY,
      width,
      height: matchedMetrics.height,
      showOnCanvas: offsetX + width <= frame.width * zoomValue,
    },
  ];
};

const escapeSpecialCharacters = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
};

export const handleSearch = debounce(
  (
    searchQuery: SearchQuery,
    app: AppClassProperties,
    cb: (matchItems: SearchMatchItem[], focusIndex: number | null) => void,
  ) => {
    if (!searchQuery || searchQuery === "") {
      cb([], null);
      return;
    }

    const elements = app.scene.getNonDeletedElements();
    const texts = elements.filter((el) =>
      isTextElement(el),
    ) as ExcalidrawTextElement[];

    const frames = elements.filter((el) =>
      isFrameLikeElement(el),
    ) as ExcalidrawFrameLikeElement[];

    texts.sort((a, b) => a.y - b.y);
    frames.sort((a, b) => a.y - b.y);

    const textMatches: SearchMatchItem[] = [];

    const regex = new RegExp(escapeSpecialCharacters(searchQuery), "gi");

    for (const textEl of texts) {
      let match = null;
      const text = textEl.originalText;

      while ((match = regex.exec(text)) !== null) {
        const preview = getMatchPreview(text, match.index, searchQuery);
        const matchedLines = getMatchedLines(
          textEl,
          searchQuery,
          match.index,
          app.renderEnvironment,
        );

        if (matchedLines.length > 0) {
          textMatches.push({
            element: textEl,
            searchQuery,
            preview,
            index: match.index,
            matchedLines,
          });
        }
      }
    }

    const frameMatches: SearchMatchItem[] = [];

    for (const frame of frames) {
      let match = null;
      const name = frame.name ?? getDefaultFrameName(frame);

      while ((match = regex.exec(name)) !== null) {
        const preview = getMatchPreview(name, match.index, searchQuery);
        const matchedLines = getMatchInFrame(
          frame,
          searchQuery,
          match.index,
          app.state.zoom.value,
          app.renderEnvironment,
        );

        if (matchedLines.length > 0) {
          frameMatches.push({
            element: frame,
            searchQuery,
            preview,
            index: match.index,
            matchedLines,
          });
        }
      }
    }

    const visibleIds = new Set(
      app.visibleElements.map((visibleElement) => visibleElement.id),
    );

    // putting frame matches first
    const matchItems: SearchMatchItem[] = [...frameMatches, ...textMatches];

    const focusIndex =
      matchItems.findIndex((matchItem) =>
        visibleIds.has(matchItem.element.id),
      ) ?? null;

    cb(matchItems, focusIndex);
  },
  SEARCH_DEBOUNCE,
);
