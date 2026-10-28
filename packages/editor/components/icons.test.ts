import { render } from "@testing-library/svelte";

import { THEME } from "@svelte-draw/common";

import * as icons from "./icons";
import Icon from "./Icon.svelte";

// Export names of the ORIGINAL React `icons.tsx` (`export const ...`),
// extracted from /Users/billyribeiro/dev/excalidraw/_baseline/packages/editor/components/icons.tsx
const ORIGINAL_EXPORT_NAMES = [
  "iconFillColor",
  "createIcon",
  "PlusPromoIcon",
  "LibraryIcon",
  "PlusIcon",
  "DotsIcon",
  "DotsHorizontalIcon",
  "PinIcon",
  "polygonIcon",
  "UnlockedIcon",
  "LockedIcon",
  "LockedIconFilled",
  "WelcomeScreenMenuArrow",
  "WelcomeScreenHelpArrow",
  "WelcomeScreenTopToolbarArrow",
  "ExcalLogo",
  "SelectionIcon",
  "LassoIcon",
  "RectangleIcon",
  "DiamondIcon",
  "EllipseIcon",
  "ArrowIcon",
  "LineIcon",
  "PenModeIcon",
  "FreedrawIcon",
  "TextIcon",
  "TextSizeIcon",
  "ImageIcon",
  "EraserIcon",
  "ZoomInIcon",
  "ZoomOutIcon",
  "ZoomResetIcon",
  "TrashIcon",
  "EmbedIcon",
  "DuplicateIcon",
  "MoonIcon",
  "SunIcon",
  "HamburgerMenuIcon",
  "ExportIcon",
  "HelpIcon",
  "HelpIconThin",
  "ExternalLinkIcon",
  "GithubIcon",
  "DiscordIcon",
  "XBrandIcon",
  "checkIcon",
  "LinkIcon",
  "save",
  "saveAs",
  "LoadIcon",
  "clipboard",
  "palette",
  "bucketFillIconSvgPaths",
  "bucketFillIcon",
  "slashIcon",
  "ExportImageIcon",
  "exportToFileIcon",
  "zoomIn",
  "zoomOut",
  "done",
  "menu",
  "UndoIcon",
  "RedoIcon",
  "questionCircle",
  "share",
  "warning",
  "shareIOS",
  "exportToPlus",
  "shareWindows",
  "resetZoom",
  "BringForwardIcon",
  "SendBackwardIcon",
  "BringToFrontIcon",
  "SendToBackIcon",
  "AlignTopIcon",
  "AlignBottomIcon",
  "AlignLeftIcon",
  "AlignRightIcon",
  "DistributeHorizontallyIcon",
  "DistributeVerticallyIcon",
  "CenterVerticallyIcon",
  "CenterHorizontallyIcon",
  "usersIcon",
  "start",
  "stop",
  "CloseIcon",
  "clone",
  "shield",
  "file",
  "GroupIcon",
  "UngroupIcon",
  "FillZigZagIcon",
  "FillHachureIcon",
  "FillCrossHatchIcon",
  "FillSolidIcon",
  "StrokeWidthBaseIcon",
  "StrokeWidthBoldIcon",
  "StrokeWidthExtraBoldIcon",
  "StrokeStyleSolidIcon",
  "StrokeStyleDashedIcon",
  "StrokeStyleDottedIcon",
  "SloppinessArchitectIcon",
  "SloppinessArtistIcon",
  "SloppinessCartoonistIcon",
  "strokeVariabilityConstantIcon",
  "strokeVariabilityVariableIcon",
  "EdgeSharpIcon",
  "EdgeRoundIcon",
  "ArrowheadNoneIcon",
  "ArrowheadArrowIcon",
  "ArrowheadTriangleIcon",
  "ArrowheadTriangleOutlineIcon",
  "ArrowheadCircleIcon",
  "ArrowheadCircleOutlineIcon",
  "ArrowheadDiamondIcon",
  "ArrowheadDiamondOutlineIcon",
  "ArrowheadBarIcon",
  "ArrowheadCardinalityOneIcon",
  "ArrowheadCardinalityManyIcon",
  "ArrowheadCardinalityOneOrManyIcon",
  "ArrowheadCardinalityExactlyOneIcon",
  "ArrowheadCardinalityZeroOrOneIcon",
  "ArrowheadCardinalityZeroOrManyIcon",
  "FontSizeSmallIcon",
  "FontSizeMediumIcon",
  "FontSizeLargeIcon",
  "FontSizeExtraLargeIcon",
  "fontSizeIcon",
  "FontFamilyHeadingIcon",
  "FontFamilyNormalIcon",
  "codeIcon",
  "FontFamilyCodeIcon",
  "TextAlignLeftIcon",
  "TextAlignCenterIcon",
  "TextAlignRightIcon",
  "TextAlignTopIcon",
  "TextAlignBottomIcon",
  "TextAlignMiddleIcon",
  "angleIcon",
  "publishIcon",
  "eraser",
  "handIcon",
  "downloadIcon",
  "copyIcon",
  "cutIcon",
  "helpIcon",
  "playerPlayIcon",
  "playerStopFilledIcon",
  "tablerCheckIcon",
  "alertTriangleIcon",
  "eyeDropperIconSvgPaths",
  "eyeDropperIcon",
  "frameToolIcon",
  "stickyNoteToolIcon",
  "mermaidLogoIcon",
  "RetryIcon",
  "stackPushIcon",
  "ArrowRightIcon",
  "drawShapeToolIcon",
  "laserPointerToolIcon",
  "MagicIcon",
  "MagicIconThin",
  "OpenAIIcon",
  "fullscreenIcon",
  "eyeIcon",
  "eyeClosedIcon",
  "brainIcon",
  "brainIconThin",
  "searchIcon",
  "historyCommandIcon",
  "historyIcon",
  "microphoneIcon",
  "microphoneMutedIcon",
  "boltIcon",
  "selectAllIcon",
  "abacusIcon",
  "flipVertical",
  "flipHorizontal",
  "paintIcon",
  "zoomAreaIcon",
  "svgIcon",
  "pngIcon",
  "magnetIcon",
  "coffeeIcon",
  "DeviceDesktopIcon",
  "loginIcon",
  "youtubeIcon",
  "gridIcon",
  "lineEditorIcon",
  "sharpArrowIcon",
  "elbowArrowIcon",
  "roundArrowIcon",
  "collapseDownIcon",
  "collapseUpIcon",
  "upIcon",
  "cropIcon",
  "elementLinkIcon",
  "resizeIcon",
  "adjustmentsIcon",
  "strokeIcon",
  "pencilIcon",
  "chevronLeftIcon",
  "sidebarRightIcon",
  "messageCircleIcon",
  "presentationIcon",
  "emptyIcon",
  "chevronDownIcon",
  "chevronRight",
  "settingsIcon",
];

// Golden markup captured from React `renderToStaticMarkup` of the original icons.
const STATIC_GOLDEN: Record<string, string> = {
  clipboard:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 384 512" class=""><path fill="currentColor" d="M384 112v352c0 26.51-21.49 48-48 48H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h80c0-35.29 28.71-64 64-64s64 28.71 64 64h80c26.51 0 48 21.49 48 48zM192 40c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24m96 114v-20a6 6 0 0 0-6-6H102a6 6 0 0 0-6 6v20a6 6 0 0 0 6 6h180a6 6 0 0 0 6-6z"></path></svg>',
  slashIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path d="M6 18l12 -12"></path></g></svg>',
  settingsIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M4 6l8 0"></path><path d="M16 6l4 0"></path><path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M4 12l2 0"></path><path d="M10 12l10 0"></path><path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path><path d="M4 18l11 0"></path><path d="M19 18l1 0"></path></g></svg>',
  chevronDownIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="6 9 12 15 18 9"></polyline></g></svg>',
  codeIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 8l-4 4l4 4"></path><path d="M17 8l4 4l-4 4"></path><path d="M14 4l-4 16"></path></g></svg>',
  FontFamilyCodeIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 8l-4 4l4 4"></path><path d="M17 8l4 4l-4 4"></path><path d="M14 4l-4 16"></path></g></svg>',
  frameToolIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7l16 0"></path><path d="M4 17l16 0"></path><path d="M7 4l0 16"></path><path d="M17 4l0 16"></path></g></svg>',
  bucketFillIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 16l1.465 1.638a2 2 0 1 1 -3.015 .099l1.55 -1.737z"></path><path d="M13.737 9.737c2.299 -2.3 3.23 -5.095 2.081 -6.245c-1.15 -1.15 -3.945 -.217 -6.244 2.082c-2.3 2.299 -3.231 5.095 -2.082 6.244c1.15 1.15 3.946 .218 6.245 -2.081z"></path><path d="M7.492 11.818c.362 .362 .768 .676 1.208 .934l6.895 4.047c1.078 .557 2.255 -.075 3.692 -1.512c1.437 -1.437 2.07 -2.614 1.512 -3.692c-.372 -.718 -1.72 -3.017 -4.047 -6.895a6.015 6.015 0 0 0 -.934 -1.208"></path></g></svg>',
  eyeDropperIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 16l11.7 -11.7a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4l-11.7 11.7h-4v-4z"></path><path d="M11 7l6 6"></path></g></svg>',
  palette:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 512 512" class=""><path fill="currentColor" d="M204.3 5C104.9 24.4 24.8 104.3 5.2 203.4c-37 187 131.7 326.4 258.8 306.7 41.2-6.4 61.4-54.6 42.5-91.7-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.3C511.5 97.1 368.1-26.9 204.3 5zM96 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm32-128c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128-64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z"></path></svg>',
  ExportImageIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M15 8h.01"></path><path d="M12 20h-5a3 3 0 0 1 -3 -3v-10a3 3 0 0 1 3 -3h10a3 3 0 0 1 3 3v5"></path><path d="M4 15l4 -4c.928 -.893 2.072 -.893 3 0l4 4"></path><path d="M14 14l1 -1c.617 -.593 1.328 -.793 2.009 -.598"></path><path d="M19 16v6"></path><path d="M22 19l-3 3l-3 -3"></path></g></svg>',
  SendBackwardIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" style="transform:rotate(180deg)" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 5l0 14"></path><path d="M16 9l-4 -4"></path><path d="M8 9l4 -4"></path></g></svg>',
  BringForwardIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M12 5l0 14"></path><path d="M16 9l-4 -4"></path><path d="M8 9l4 -4"></path></g></svg>',
  emptyIcon: '<div style="width:1rem;height:1rem"></div>',
  PlusPromoIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="3" y="8" width="18" height="4" rx="1"></rect><line x1="12" y1="8" x2="12" y2="21"></line><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5"></path></g></svg>',
  LibraryIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0"></path><path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0"></path><line x1="3" y1="6" x2="3" y2="19"></line><line x1="12" y1="6" x2="12" y2="19"></line><line x1="21" y1="6" x2="21" y2="19"></line></g></svg>',
  LockedIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path d="M13.542 8.542H6.458a2.5 2.5 0 0 0-2.5 2.5v3.75a2.5 2.5 0 0 0 2.5 2.5h7.084a2.5 2.5 0 0 0 2.5-2.5v-3.75a2.5 2.5 0 0 0-2.5-2.5Z"></path><path d="M10 13.958a1.042 1.042 0 1 0 0-2.083 1.042 1.042 0 0 0 0 2.083Z"></path><path d="M6.667 8.333V5.417C6.667 3.806 8.159 2.5 10 2.5c1.841 0 3.333 1.306 3.333 2.917v2.916"></path></g></svg>',
  UnlockedIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g><path d="M13.542 8.542H6.458a2.5 2.5 0 0 0-2.5 2.5v3.75a2.5 2.5 0 0 0 2.5 2.5h7.084a2.5 2.5 0 0 0 2.5-2.5v-3.75a2.5 2.5 0 0 0-2.5-2.5Z" stroke="currentColor" stroke-width="1.25"></path><path d="M10 13.958a1.042 1.042 0 1 0 0-2.083 1.042 1.042 0 0 0 0 2.083Z" stroke="currentColor" stroke-width="1.25"></path><mask id="UnlockedIcon" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="6" y="1" width="9" height="9"><path stroke="none" d="M6.399 9.561V5.175c0-.93.401-1.823 1.116-2.48a3.981 3.981 0 0 1 2.693-1.028c1.01 0 1.98.37 2.694 1.027.715.658 1.116 1.55 1.116 2.481" fill="#fff"></path></mask><g mask="url(#UnlockedIcon)"><path stroke="none" d="M5.149 9.561v1.25h2.5v-1.25h-2.5Zm5.06-7.894V.417v1.25Zm2.559 3.508v1.25h2.5v-1.25h-2.5ZM7.648 8.51V5.175h-2.5V8.51h2.5Zm0-3.334c0-.564.243-1.128.713-1.561L6.668 1.775c-.959.883-1.52 2.104-1.52 3.4h2.5Zm.713-1.561a2.732 2.732 0 0 1 1.847-.697v-2.5c-1.31 0-2.585.478-3.54 1.358L8.36 3.614Zm1.847-.697c.71 0 1.374.26 1.847.697l1.694-1.839a5.231 5.231 0 0 0-3.54-1.358v2.5Zm1.847.697c.47.433.713.997.713 1.561h2.5c0-1.296-.56-2.517-1.52-3.4l-1.693 1.839Z" fill="currentColor"></path></g></g></svg>',
  WelcomeScreenMenuArrow:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 41 94" class="" fill="none"><path d="M38.5 83.5c-14-2-17.833-10.473-21-22.5C14.333 48.984 12 22 12 12.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="m12.005 10.478 7.905 14.423L6 25.75l6.005-15.273Z" fill="currentColor"></path><path d="M12.005 10.478c1.92 3.495 3.838 7 7.905 14.423m-7.905-14.423c3.11 5.683 6.23 11.368 7.905 14.423m0 0c-3.68.226-7.35.455-13.91.85m13.91-.85c-5.279.33-10.566.647-13.91.85m0 0c1.936-4.931 3.882-9.86 6.005-15.273M6 25.75c2.069-5.257 4.135-10.505 6.005-15.272" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>',
  questionCircle:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 512 512" class="rtl-mirror"><path fill="currentColor" d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z"></path></svg>',
  clone:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 512 512" class="rtl-mirror"><path fill="currentColor" d="M464 0c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48H176c-26.51 0-48-21.49-48-48V48c0-26.51 21.49-48 48-48h288M176 416c-44.112 0-80-35.888-80-80V128H48c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h288c26.51 0 48-21.49 48-48v-48H176z"></path></svg>',
  FillHachureIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" stroke="currentColor" stroke-width="1.25"></path><mask id="FillHachureIcon" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="16" height="16"><path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" fill="currentColor" stroke="currentColor" stroke-width="1.25"></path></mask><g mask="url(#FillHachureIcon)"><path d="M2.258 15.156 15.156 2.258M7.324 20.222 20.222 7.325m-20.444 5.35L12.675-.222m-8.157 18.34L17.416 5.22" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>',
  FillCrossHatchIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g clip-path="url(#a)"><path d="M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z" stroke="currentColor" stroke-width="1.25"></path><mask id="FillCrossHatchIcon" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="-1" y="-1" width="22" height="22"><path d="M2.426 15.044 15.044 2.426M7.383 20 20 7.383M0 12.617 12.617 0m-7.98 17.941L17.256 5.324m-2.211 12.25L2.426 4.956M20 12.617 7.383 0m5.234 20L0 7.383m17.941 7.98L5.324 2.745" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"></path></mask><g mask="url(#FillCrossHatchIcon)"><path d="M14.121 2H5.88A3.879 3.879 0 0 0 2 5.879v8.242A3.879 3.879 0 0 0 5.879 18h8.242A3.879 3.879 0 0 0 18 14.121V5.88A3.879 3.879 0 0 0 14.121 2Z" fill="currentColor"></path></g></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h20v20H0z"></path></clipPath></defs></svg>',
  WelcomeScreenTopToolbarArrow:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 38 78" class="" fill="none"><path d="M1 77c14-2 31.833-11.973 35-24 3.167-12.016-6-35-9.5-43.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><path fill-rule="evenodd" clip-rule="evenodd" d="m24.165 1.093-2.132 16.309 13.27-4.258-11.138-12.05Z" fill="currentColor"></path><path d="M24.165 1.093c-.522 3.953-1.037 7.916-2.132 16.309m2.131-16.309c-.835 6.424-1.68 12.854-2.13 16.308m0 0c3.51-1.125 7.013-2.243 13.27-4.257m-13.27 4.257c5.038-1.608 10.08-3.232 13.27-4.257m0 0c-3.595-3.892-7.197-7.777-11.14-12.05m11.14 12.05c-3.837-4.148-7.667-8.287-11.14-12.05" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>',
  TextSizeIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke="currentColor" stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M3 7v-2h13v2"></path><path d="M10 5v14"></path><path d="M12 19h-4"></path><path d="M15 13v-1h6v1"></path><path d="M18 12v7"></path><path d="M17 19h2"></path></g></svg>',
  ExportIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="1.25" d="M3.333 14.167v1.666c0 .92.747 1.667 1.667 1.667h10c.92 0 1.667-.746 1.667-1.667v-1.666M5.833 9.167 10 13.333l4.167-4.166M10 3.333v10"></path></svg>',
  AlignBottomIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g clip-path="url(#a)" stroke="currentColor" stroke-width="1.25"><path d="M3.333 16.667h13.334" stroke-linecap="round" stroke-linejoin="round"></path><path d="M6.875 3.125h-.417c-.92 0-1.666.746-1.666 1.667v7.083c0 .92.746 1.667 1.666 1.667h.417c.92 0 1.667-.746 1.667-1.667V4.792c0-.92-.747-1.667-1.667-1.667ZM13.542 5.817h-.417c-.92 0-1.667.747-1.667 1.667v4.391c0 .92.746 1.667 1.667 1.667h.417c.92 0 1.666-.746 1.666-1.667V7.484c0-.92-.746-1.667-1.666-1.667Z"></path></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h20v20H0z"></path></clipPath></defs></svg>',
  shield:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class=""><path fill="currentColor" d="M11.553 22.894a.998.998 0 00.894 0s3.037-1.516 5.465-4.097C19.616 16.987 21 14.663 21 12V5a1 1 0 00-.649-.936l-8-3a.998.998 0 00-.702 0l-8 3A1 1 0 003 5v7c0 2.663 1.384 4.987 3.088 6.797 2.428 2.581 5.465 4.097 5.465 4.097zm-1.303-8.481l6.644-6.644a.856.856 0 111.212 1.212l-7.25 7.25a.856.856 0 01-1.212 0l-3.75-3.75a.856.856 0 111.212-1.212l3.144 3.144z"></path></svg>',
  SloppinessArtistIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12.563c1.655-.886 5.9-3.293 8.568-4.355 2.668-1.062.101 2.822 1.32 3.105 1.218.283 5.112-1.814 5.112-1.814m-13.469 2.23c2.963-1.586 6.13-5.62 7.468-4.998 1.338.623-1.153 4.11-.132 5.595 1.02 1.487 6.133-1.43 6.133-1.43" stroke-width="1.25"></path></svg>',
  FontFamilyNormalIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5.833 16.667v-10a3.333 3.333 0 0 1 3.334-3.334h1.666a3.333 3.333 0 0 1 3.334 3.334v10M5.833 10.833h8.334"></path></g></svg>',
  cutIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M7 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path><path d="M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"></path><path d="M9.15 14.85l8.85 -10.85"></path><path d="M6 4l8.85 10.85"></path></g></svg>',
  ArrowRightIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" class="" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path d="M4.16602 10H15.8327"></path><path d="M12.5 13.3333L15.8333 10"></path><path d="M12.5 6.66666L15.8333 9.99999"></path></g></svg>',
  historyCommandIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M20.984 12.53a9 9 0 1 0 -7.552 8.355"></path><path d="M12 7v5l3 3"></path><path d="M19 16l-2 3h4l-2 3"></path></g></svg>',
  pngIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.25"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"></path><path d="M20 15h-1a2 2 0 0 0 -2 2v2a2 2 0 0 0 2 2h1v-3"></path><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"></path><path d="M11 21v-6l3 6v-6"></path></g></svg>',
  collapseUpIcon:
    '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 15l6 -6l6 6"></path></g></svg>',
};

// Original React.memo icons: markup rendered by React for both variants.
const FUNCTION_GOLDEN: Record<
  string,
  { variants: Record<string, unknown>[]; outputs: string[] }
> = {
  GroupIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 182 182" class="rtl-mirror"><path d="M25 26H111V111H25" fill="var(--icon-fill-color)"></path><path d="M25 111C25 80.2068 25 49.4135 25 26M25 26C48.6174 26 72.2348 26 111 26H25ZM25 26C53.3671 26 81.7343 26 111 26H25ZM111 26C111 52.303 111 78.606 111 111V26ZM111 26C111 51.2947 111 76.5893 111 111V26ZM111 111C87.0792 111 63.1585 111 25 111H111ZM111 111C87.4646 111 63.9293 111 25 111H111ZM25 111C25 81.1514 25 51.3028 25 26V111Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><path d="M100 100H160V160H100" fill="var(--icon-fill-color)"></path><path d="M100 160C100 144.106 100 128.211 100 100M100 100C117.706 100 135.412 100 160 100H100ZM100 100C114.214 100 128.428 100 160 100H100ZM160 100C160 120.184 160 140.369 160 160V100ZM160 100C160 113.219 160 126.437 160 160V100ZM160 160C145.534 160 131.068 160 100 160H160ZM160 160C143.467 160 126.934 160 100 160H160ZM100 160C100 143.661 100 127.321 100 100V160Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><g fill="#fff" stroke="var(--icon-fill-color)" stroke-width="6"><rect x="2.5" y="2.5" width="30" height="30"></rect><rect x="2.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="2.5" width="30" height="30"></rect></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 182 182" class="rtl-mirror"><path d="M25 26H111V111H25" fill="var(--icon-fill-color)"></path><path d="M25 111C25 80.2068 25 49.4135 25 26M25 26C48.6174 26 72.2348 26 111 26H25ZM25 26C53.3671 26 81.7343 26 111 26H25ZM111 26C111 52.303 111 78.606 111 111V26ZM111 26C111 51.2947 111 76.5893 111 111V26ZM111 111C87.0792 111 63.1585 111 25 111H111ZM111 111C87.4646 111 63.9293 111 25 111H111ZM25 111C25 81.1514 25 51.3028 25 26V111Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><path d="M100 100H160V160H100" fill="var(--icon-fill-color)"></path><path d="M100 160C100 144.106 100 128.211 100 100M100 100C117.706 100 135.412 100 160 100H100ZM100 100C114.214 100 128.428 100 160 100H100ZM160 100C160 120.184 160 140.369 160 160V100ZM160 100C160 113.219 160 126.437 160 160V100ZM160 160C145.534 160 131.068 160 100 160H160ZM160 160C143.467 160 126.934 160 100 160H160ZM100 160C100 143.661 100 127.321 100 100V160Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><g fill="#1e1e1e" stroke="var(--icon-fill-color)" stroke-width="6"><rect x="2.5" y="2.5" width="30" height="30"></rect><rect x="2.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="2.5" width="30" height="30"></rect></g></svg>',
    ],
  },
  UngroupIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 182 182" class="rtl-mirror"><path d="M25 26H111V111H25" fill="var(--icon-fill-color)"></path><path d="M25 111C25 80.2068 25 49.4135 25 26M25 26C48.6174 26 72.2348 26 111 26H25ZM25 26C53.3671 26 81.7343 26 111 26H25ZM111 26C111 52.303 111 78.606 111 111V26ZM111 26C111 51.2947 111 76.5893 111 111V26ZM111 111C87.0792 111 63.1585 111 25 111H111ZM111 111C87.4646 111 63.9293 111 25 111H111ZM25 111C25 81.1514 25 51.3028 25 26V111Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><path d="M100 100H160V160H100" fill="var(--icon-fill-color)"></path><path d="M100 160C100 144.106 100 128.211 100 100M100 100C117.706 100 135.412 100 160 100H100ZM100 100C114.214 100 128.428 100 160 100H100ZM160 100C160 120.184 160 140.369 160 160V100ZM160 100C160 113.219 160 126.437 160 160V100ZM160 160C145.534 160 131.068 160 100 160H160ZM160 160C143.467 160 126.934 160 100 160H160ZM100 160C100 143.661 100 127.321 100 100V160Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><g fill="#fff" stroke="var(--icon-fill-color)" stroke-width="6"><rect x="2.5" y="2.5" width="30" height="30"></rect><rect x="78.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="78.5" width="30" height="30"></rect><rect x="105.5" y="2.5" width="30" height="30"></rect><rect x="2.5" y="102.5" width="30" height="30"></rect></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 182 182" class="rtl-mirror"><path d="M25 26H111V111H25" fill="var(--icon-fill-color)"></path><path d="M25 111C25 80.2068 25 49.4135 25 26M25 26C48.6174 26 72.2348 26 111 26H25ZM25 26C53.3671 26 81.7343 26 111 26H25ZM111 26C111 52.303 111 78.606 111 111V26ZM111 26C111 51.2947 111 76.5893 111 111V26ZM111 111C87.0792 111 63.1585 111 25 111H111ZM111 111C87.4646 111 63.9293 111 25 111H111ZM25 111C25 81.1514 25 51.3028 25 26V111Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><path d="M100 100H160V160H100" fill="var(--icon-fill-color)"></path><path d="M100 160C100 144.106 100 128.211 100 100M100 100C117.706 100 135.412 100 160 100H100ZM100 100C114.214 100 128.428 100 160 100H100ZM160 100C160 120.184 160 140.369 160 160V100ZM160 100C160 113.219 160 126.437 160 160V100ZM160 160C145.534 160 131.068 160 100 160H160ZM160 160C143.467 160 126.934 160 100 160H160ZM100 160C100 143.661 100 127.321 100 100V160Z" stroke="var(--icon-fill-color)" stroke-width="2"></path><g fill="#1e1e1e" stroke="var(--icon-fill-color)" stroke-width="6"><rect x="2.5" y="2.5" width="30" height="30"></rect><rect x="78.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="149.5" width="30" height="30"></rect><rect x="147.5" y="78.5" width="30" height="30"></rect><rect x="105.5" y="2.5" width="30" height="30"></rect><rect x="2.5" y="102.5" width="30" height="30"></rect></g></svg>',
    ],
  },
  StrokeStyleSolidIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><path d="M6 10H34" stroke="var(--icon-fill-color)" stroke-width="2" fill="none" stroke-linecap="round"></path></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><path d="M6 10H34" stroke="var(--icon-fill-color)" stroke-width="2" fill="none" stroke-linecap="round"></path></svg>',
    ],
  },
  ArrowheadNoneIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="" stroke="currentColor" opacity="0.3" stroke-width="2" fill="none" stroke-linecap="round"><path d="M7,11 H19"></path><path d="M25,6 L33,16 M33,6 L25,16"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="translate(40, 0) scale(-1, 1)" stroke="currentColor" opacity="0.3" stroke-width="2" fill="none" stroke-linecap="round"><path d="M7,11 H19"></path><path d="M25,6 L33,16 M33,6 L25,16"></path></g></svg>',
    ],
  },
  ArrowheadArrowIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7,11 H33 M23,5 L33,11 L23,17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="translate(40, 0) scale(-1, 1)" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M7,11 H33 M23,5 L33,11 L23,17"></path></g></svg>',
    ],
  },
  ArrowheadTriangleIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform="" stroke-linejoin="round"><path d="M7,11 H23" stroke-width="2" stroke-linecap="round"></path><path d="M23,5 L35,11 L23,17 Z"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round"><path d="M7,11 H23" stroke-width="2" stroke-linecap="round"></path><path d="M23,5 L35,11 L23,17 Z"></path></g></svg>',
    ],
  },
  ArrowheadTriangleOutlineIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M7,11 H23"></path><path d="M23,5 L35,11 L23,17 Z"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M7,11 H23"></path><path d="M23,5 L35,11 L23,17 Z"></path></g></svg>',
    ],
  },
  ArrowheadCircleIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform=""><path d="M7,11 H25" stroke-width="2" stroke-linecap="round"></path><circle cx="29" cy="11" r="4"></circle></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform="translate(40, 0) scale(-1, 1)"><path d="M7,11 H25" stroke-width="2" stroke-linecap="round"></path><circle cx="29" cy="11" r="4"></circle></g></svg>',
    ],
  },
  ArrowheadCircleOutlineIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-width="2"><path d="M7,11 H25" stroke-linecap="round"></path><circle cx="29" cy="11" r="4"></circle></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-width="2"><path d="M7,11 H25" stroke-linecap="round"></path><circle cx="29" cy="11" r="4"></circle></g></svg>',
    ],
  },
  ArrowheadDiamondIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform="" stroke-linejoin="round"><path d="M7,11 H21" stroke-width="2" stroke-linecap="round"></path><path d="M21,11 L28,5 L35,11 L28,17 Z"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="currentColor" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round"><path d="M7,11 H21" stroke-width="2" stroke-linecap="round"></path><path d="M21,11 L28,5 L35,11 L28,17 Z"></path></g></svg>',
    ],
  },
  ArrowheadDiamondOutlineIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2" stroke-linecap="round"><path d="M7,11 H21"></path><path d="M21,11 L28,5 L35,11 L28,17 Z"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2" stroke-linecap="round"><path d="M7,11 H21"></path><path d="M21,11 L28,5 L35,11 L28,17 Z"></path></g></svg>',
    ],
  },
  ArrowheadBarIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M11,11 H31 M31,5 V17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g transform="translate(40, 0) scale(-1, 1)" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><path d="M11,11 H31 M31,5 V17"></path></g></svg>',
    ],
  },
  ArrowheadCardinalityOneIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,5 V17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,5 V17"></path></g></svg>',
    ],
  },
  ArrowheadCardinalityManyIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,11 L7,5 M15,11 L7,17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,11 L7,5 M15,11 L7,17"></path></g></svg>',
    ],
  },
  ArrowheadCardinalityOneOrManyIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M23,5 V17 M15,11 L7,5 M15,11 L7,17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M23,5 V17 M15,11 L7,5 M15,11 L7,17"></path></g></svg>',
    ],
  },
  ArrowheadCardinalityExactlyOneIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,5 V17 M7,5 V17"></path></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H7 M15,5 V17 M7,5 V17"></path></g></svg>',
    ],
  },
  ArrowheadCardinalityZeroOrOneIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H19 M11,11 H7 M7,5 V17"></path><circle cx="15" cy="11" r="4"></circle></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H19 M11,11 H7 M7,5 V17"></path><circle cx="15" cy="11" r="4"></circle></g></svg>',
    ],
  },
  ArrowheadCardinalityZeroOrManyIcon: {
    variants: [
      {
        flip: false,
      },
      {
        flip: true,
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="translate(40, 0) scale(-1, 1)" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H27 M19,11 H7 M15,11 L7,5 M15,11 L7,17"></path><circle cx="23" cy="11" r="4"></circle></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 40 20" class=""><g stroke="currentColor" fill="none" transform="" stroke-linejoin="round" stroke-width="2"><path d="M35,11 H27 M19,11 H7 M15,11 L7,5 M15,11 L7,17"></path><circle cx="23" cy="11" r="4"></circle></g></svg>',
    ],
  },
  TextAlignTopIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="4" x2="20" y2="4"></line><rect x="9" y="8" width="6" height="12" rx="2"></rect></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="4" x2="20" y2="4"></line><rect x="9" y="8" width="6" height="12" rx="2"></rect></g></svg>',
    ],
  },
  TextAlignBottomIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="20" x2="20" y2="20"></line><rect x="9" y="4" width="6" height="12" rx="2"></rect></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="20" x2="20" y2="20"></line><rect x="9" y="4" width="6" height="12" rx="2"></rect></g></svg>',
    ],
  },
  TextAlignMiddleIcon: {
    variants: [
      {
        theme: "light",
      },
      {
        theme: "dark",
      },
    ],
    outputs: [
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="20" y2="12"></line><rect x="9" y="6" width="6" height="12" rx="2"></rect></g></svg>',
      '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 24 24" class="" fill="none" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="12" x2="9" y2="12"></line><line x1="15" y1="12" x2="20" y2="12"></line><rect x="9" y="6" width="6" height="12" rx="2"></rect></g></svg>',
    ],
  },
};

describe("icons.ts", () => {
  it("exports exactly the names exported by the original icons.tsx", () => {
    expect(ORIGINAL_EXPORT_NAMES).toHaveLength(209);
    expect(Object.keys(icons).sort()).toEqual(
      [...ORIGINAL_EXPORT_NAMES].sort(),
    );
  });

  it.each(Object.keys(STATIC_GOLDEN))(
    "%s markup matches React output",
    (name) => {
      expect((icons as any)[name].html).toBe(STATIC_GOLDEN[name]);
    },
  );

  it.each(Object.keys(FUNCTION_GOLDEN))(
    "%s function icon matches React output for all variants",
    (name) => {
      const { variants, outputs } = FUNCTION_GOLDEN[name];
      variants.forEach((props, i) => {
        const arg = "theme" in props ? { theme: props.theme } : props;
        expect((icons as any)[name](arg).html).toBe(outputs[i]);
      });
    },
  );

  it("theme icons differ between themes only by handler color", () => {
    const light = icons.GroupIcon({ theme: THEME.LIGHT }).html;
    const dark = icons.GroupIcon({ theme: THEME.DARK }).html;
    expect(light).not.toBe(dark);
    expect(light.replaceAll("#fff", "#1e1e1e")).toBe(dark);
  });

  it("FontFamilyCodeIcon is the codeIcon alias", () => {
    expect(icons.FontFamilyCodeIcon).toBe(icons.codeIcon);
  });

  it("iconFillColor returns the css variable", () => {
    expect(icons.iconFillColor(THEME.DARK)).toBe("var(--icon-fill-color)");
  });

  describe("createIcon", () => {
    const tabler = {
      width: 24,
      height: 24,
      fill: "none",
      strokeWidth: 2,
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };

    it("builds a tabler icon identical to React output", () => {
      expect(
        icons.createIcon(
          '<g stroke-width="1.5"><path d="M6 18l12 -12"></path></g>',
          tabler,
        ).html,
      ).toBe(STATIC_GOLDEN.slashIcon);
    });

    it("builds a path icon with width/height identical to React output", () => {
      const d = /<path fill="currentColor" d="([^"]+)"/.exec(
        STATIC_GOLDEN.clipboard,
      )![1];
      expect(icons.createIcon(d, { width: 384, height: 512 }).html).toBe(
        STATIC_GOLDEN.clipboard,
      );
    });

    it("defaults to a 512 path icon and numeric opts mean width", () => {
      expect(icons.createIcon("M0 0h1").html).toBe(
        '<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 512 512" class=""><path fill="currentColor" d="M0 0h1"></path></svg>',
      );
      expect(icons.createIcon("M0 0h1", 24).html).toContain(
        'viewBox="0 0 24 24"',
      );
    });

    it("supports mirror and style", () => {
      const html = icons.createIcon("M0 0h1", {
        mirror: true,
        style: "transform: rotate(180deg)",
      }).html;
      expect(html).toContain('class="rtl-mirror"');
      expect(html).toContain('style="transform: rotate(180deg)"');
      expect(
        icons.createIcon(
          '<g stroke-width="1.5"><path d="M6 18l12 -12"></path></g>',
          { ...tabler, style: "transform:rotate(180deg)" },
        ).html,
      ).toContain('style="transform:rotate(180deg)"');
    });

    it("escapes attribute values", () => {
      expect(icons.createIcon('a"b<', 8).html).toContain('d="a&quot;b&lt;"');
    });
  });
});

describe("Icon.svelte", () => {
  it("renders the svg directly inside its parent, without a wrapper", () => {
    const { container } = render(Icon, { icon: icons.slashIcon });
    expect(container.children).toHaveLength(1);
    const svg = container.firstElementChild as Element;
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("svg path")).not.toBeNull();
  });

  it("renders non-svg icons (emptyIcon) directly too", () => {
    const { container } = render(Icon, { icon: icons.emptyIcon });
    expect(container.children).toHaveLength(1);
    expect((container.firstElementChild as HTMLElement).tagName).toBe("DIV");
  });

  it("updates when the icon prop changes", async () => {
    const { container, rerender } = render(Icon, { icon: icons.slashIcon });
    await rerender({ icon: icons.palette });
    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild!.getAttribute("viewBox")).toBe(
      "0 0 512 512",
    );
  });
});
