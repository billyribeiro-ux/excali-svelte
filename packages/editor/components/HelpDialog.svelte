<script lang="ts">
  import {
    isDarwin,
    isFirefox,
    isWindows,
    KEYS,
    REPOSITORY_DOCS_URL,
    REPOSITORY_ISSUES_URL,
  } from "@svelte-draw/common";

  import { actionToggleTheme } from "../actions/actionCanvas";
  import { getShortcutFromShortcutName } from "../actions/shortcuts";
  import { probablySupportsClipboardBlob } from "../clipboard";
  import { t } from "../i18n";
  import { getShortcutKey } from "../shortcut";
  import { getEditorContext } from "../ui/editorContext";

  import Dialog from "./Dialog.svelte";
  import Icon from "./Icon.svelte";
  import { ExternalLinkIcon, GithubIcon } from "./icons";

  import "./HelpDialog.scss";

  let { onClose }: { onClose?: () => void } = $props();

  const ctx = getEditorContext();
  const actionManager = $derived(ctx.actionManager);

  const handleClose = () => {
    onClose?.();
  };

  const upperCaseSingleChars = (str: string) => {
    return str.replace(/\b[a-z]\b/, (c) => c.toUpperCase());
  };

  const splitShortcutKeys = (shortcut: string) =>
    (shortcut.endsWith("++")
      ? [...shortcut.slice(0, -2).split("+"), "+"]
      : shortcut.split("+")
    ).map(upperCaseSingleChars);
</script>

{#snippet header()}
  <div class="HelpDialog__header">
    <a
      class="HelpDialog__btn"
      href={REPOSITORY_DOCS_URL}
      target="_blank"
      rel="noopener"
    >
      <div class="HelpDialog__link-icon"><Icon icon={ExternalLinkIcon} /></div>
      {t("helpDialog.documentation")}
    </a>
    <a
      class="HelpDialog__btn"
      href={REPOSITORY_ISSUES_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="HelpDialog__link-icon"><Icon icon={GithubIcon} /></div>
      {t("helpDialog.github")}
    </a>
  </div>
{/snippet}

{#snippet shortcut(label: string, shortcuts: string[], isOr: boolean = true)}
  <div class="HelpDialog__shortcut">
    <div>{label}</div>
    <div class="HelpDialog__key-container">
      {#each shortcuts as shortcutText, index (index)}
        {#if index > 0 && isOr}{t("helpDialog.or")}{/if}
        {#each splitShortcutKeys(shortcutText) as key, keyIndex (keyIndex)}
          <kbd class="HelpDialog__key">{key}</kbd>
        {/each}
      {/each}
    </div>
  </div>
{/snippet}

<Dialog
  onCloseRequest={handleClose}
  title={t("helpDialog.title")}
  class="HelpDialog"
>
  {@render header()}
        <h3>{t("helpDialog.shortcuts")}</h3>
<div class="HelpDialog__islands-container">
          <div class="HelpDialog__island HelpDialog__island--tools">
<h4 class="HelpDialog__island-title">{t("helpDialog.tools")}</h4>
<div class="HelpDialog__island-content">
            {@render shortcut(t("toolBar.hand"), [KEYS.H])}
            {@render shortcut(t("toolBar.selection"), [KEYS.V, KEYS["1"]])}
            {@render shortcut(t("toolBar.rectangle"), [KEYS.R, KEYS["2"]])}
            {@render shortcut(t("toolBar.diamond"), [KEYS.D, KEYS["3"]])}
            {@render shortcut(t("toolBar.ellipse"), [KEYS.O, KEYS["4"]])}
            {@render shortcut(t("toolBar.arrow"), [KEYS.A, KEYS["5"]])}
            {@render shortcut(t("toolBar.line"), [KEYS.L, KEYS["6"]])}
            {@render shortcut(t("toolBar.freedraw"), [KEYS.P, KEYS["7"]])}
            {@render shortcut(t("toolBar.text"), [KEYS.T, KEYS["8"]])}
            {@render shortcut(t("toolBar.stickynote"), [KEYS.N])}
            {@render shortcut(t("toolBar.image"), [KEYS["9"]])}
            {@render shortcut(t("toolBar.eraser"), [KEYS.E, KEYS["0"]])}
            {@render shortcut(t("toolBar.frame"), [KEYS.F])}
            {@render shortcut(t("toolBar.laser"), [KEYS.K])}
            {@render shortcut(t("toolBar.bucketfill"), [KEYS.B])}
            {@render shortcut(t("labels.eyeDropper"), [KEYS.I, "Shift+S", "Shift+G"])}
            {@render shortcut(t("helpDialog.editLineArrowPoints"), [getShortcutKey("CtrlOrCmd+Enter")])}
            {@render shortcut(t("helpDialog.editText"), [getShortcutKey("Enter")])}
            {@render shortcut(t("helpDialog.textNewLine"), [
                getShortcutKey("Enter"),
                getShortcutKey("Shift+Enter"),
              ])}
            {@render shortcut(t("helpDialog.textFinish"), [
                getShortcutKey("Esc"),
                getShortcutKey("CtrlOrCmd+Enter"),
              ])}
            {@render shortcut(t("helpDialog.curvedArrow"), [
                "A",
                t("helpDialog.click"),
                t("helpDialog.click"),
                t("helpDialog.click"),
              ], false)}
            {@render shortcut(t("helpDialog.curvedLine"), [
                "L",
                t("helpDialog.click"),
                t("helpDialog.click"),
                t("helpDialog.click"),
              ], false)}
            {@render shortcut(t("helpDialog.cropStart"), [t("helpDialog.doubleClick"), getShortcutKey("Enter")], true)}
            {@render shortcut(t("helpDialog.cropFinish"), [getShortcutKey("Enter"), getShortcutKey("Escape")], true)}
            {@render shortcut(t("toolBar.lock"), [KEYS.Q])}
            {@render shortcut(t("helpDialog.preventBinding"), [getShortcutKey("CtrlOrCmd")])}
            {@render shortcut(t("toolBar.link"), [getShortcutKey("CtrlOrCmd+K")])}
            {@render shortcut(t("toolBar.convertElementType"), ["Tab", "Shift+Tab"], true)}
          </div>
</div>
          <div class="HelpDialog__island HelpDialog__island--view">
<h4 class="HelpDialog__island-title">{t("helpDialog.view")}</h4>
<div class="HelpDialog__island-content">
            {@render shortcut(t("buttons.zoomIn"), [getShortcutKey("CtrlOrCmd++")])}
            {@render shortcut(t("buttons.zoomOut"), [getShortcutKey("CtrlOrCmd+-")])}
            {@render shortcut(t("buttons.resetZoom"), [getShortcutKey("CtrlOrCmd+0")])}
            {@render shortcut(t("helpDialog.zoomToFit"), ["Shift+1"])}
            {@render shortcut(t("helpDialog.zoomToSelection"), ["Shift+2"])}
            {@render shortcut(t("helpDialog.movePageUpDown"), ["PgUp/PgDn"])}
            {@render shortcut(t("helpDialog.movePageLeftRight"), ["Shift+PgUp/PgDn"])}
            {@render shortcut(t("buttons.zenMode"), [getShortcutKey("Alt+Z")])}
            {@render shortcut(t("buttons.objectsSnapMode"), [getShortcutKey("Alt+S")])}
            {@render shortcut(t("labels.toggleGrid"), [getShortcutKey("CtrlOrCmd+'")])}
            {@render shortcut(t("labels.viewMode"), [getShortcutKey("Alt+R")])}
            {#if actionManager.isActionEnabled(actionToggleTheme)}
              {@render shortcut(t("labels.toggleTheme"), [getShortcutKey("Alt+Shift+D")])}
            {/if}
            {@render shortcut(t("stats.fullTitle"), [getShortcutKey("Alt+/")])}
            {@render shortcut(t("search.title"), [getShortcutFromShortcutName("searchMenu")])}
            {@render shortcut(t("commandPalette.title"), isFirefox
                  ? [getShortcutFromShortcutName("commandPalette")]
                  : [
                      getShortcutFromShortcutName("commandPalette"),
                      getShortcutFromShortcutName("commandPalette", 1),
                    ])}
          </div>
</div>
          <div class="HelpDialog__island HelpDialog__island--editor">
<h4 class="HelpDialog__island-title">{t("helpDialog.editor")}</h4>
<div class="HelpDialog__island-content">
            {@render shortcut(t("helpDialog.createFlowchart"), [getShortcutKey(`CtrlOrCmd+Arrow Key`)], true)}
            {@render shortcut(t("helpDialog.navigateFlowchart"), [getShortcutKey(`Alt+Arrow Key`)], true)}
            {@render shortcut(t("labels.moveCanvas"), [
                getShortcutKey(`Space+${t("helpDialog.drag")}`),
                getShortcutKey(`Wheel+${t("helpDialog.drag")}`),
              ], true)}
            {@render shortcut(t("buttons.clearReset"), [getShortcutKey("CtrlOrCmd+Delete")])}
            {@render shortcut(t("labels.delete"), [getShortcutKey("Delete")])}
            {@render shortcut(t("labels.cut"), [getShortcutKey("CtrlOrCmd+X")])}
            {@render shortcut(t("labels.copy"), [getShortcutKey("CtrlOrCmd+C")])}
            {@render shortcut(t("labels.paste"), [getShortcutKey("CtrlOrCmd+V")])}
            {@render shortcut(t("labels.pasteAsPlaintext"), [getShortcutKey("CtrlOrCmd+Shift+V")])}
            {@render shortcut(t("labels.selectAll"), [getShortcutKey("CtrlOrCmd+A")])}
            {@render shortcut(t("labels.multiSelect"), [getShortcutKey(`Shift+${t("helpDialog.click")}`)])}
            {@render shortcut(t("helpDialog.deepSelect"), [getShortcutKey(`CtrlOrCmd+${t("helpDialog.click")}`)])}
            {@render shortcut(t("helpDialog.deepBoxSelect"), [getShortcutKey(`CtrlOrCmd+${t("helpDialog.drag")}`)])}
            <!-- firefox supports clipboard API under a flag, so we'll
                show users what they can do in the error message -->
            {#if probablySupportsClipboardBlob || isFirefox}
              {@render shortcut(t("labels.copyAsPng"), [getShortcutKey("Shift+Alt+C")])}
            {/if}
            {@render shortcut(t("labels.copyStyles"), [getShortcutKey("CtrlOrCmd+Alt+C")])}
            {@render shortcut(t("labels.pasteStyles"), [getShortcutKey("CtrlOrCmd+Alt+V")])}
            {@render shortcut(t("labels.sendToBack"), [
                isDarwin
                  ? getShortcutKey("CtrlOrCmd+Alt+[")
                  : getShortcutKey("CtrlOrCmd+Shift+["),
              ])}
            {@render shortcut(t("labels.bringToFront"), [
                isDarwin
                  ? getShortcutKey("CtrlOrCmd+Alt+]")
                  : getShortcutKey("CtrlOrCmd+Shift+]"),
              ])}
            {@render shortcut(t("labels.sendBackward"), [getShortcutKey("CtrlOrCmd+[")])}
            {@render shortcut(t("labels.bringForward"), [getShortcutKey("CtrlOrCmd+]")])}
            {@render shortcut(t("labels.alignTop"), [getShortcutKey("CtrlOrCmd+Shift+Up")])}
            {@render shortcut(t("labels.alignBottom"), [getShortcutKey("CtrlOrCmd+Shift+Down")])}
            {@render shortcut(t("labels.alignLeft"), [getShortcutKey("CtrlOrCmd+Shift+Left")])}
            {@render shortcut(t("labels.alignRight"), [getShortcutKey("CtrlOrCmd+Shift+Right")])}
            {@render shortcut(t("labels.duplicateSelection"), [
                getShortcutKey("CtrlOrCmd+D"),
                getShortcutKey(`Alt+${t("helpDialog.drag")}`),
              ])}
            {@render shortcut(t("helpDialog.toggleElementLock"), [getShortcutKey("CtrlOrCmd+Shift+L")])}
            {@render shortcut(t("buttons.undo"), [getShortcutKey("CtrlOrCmd+Z")])}
            {@render shortcut(t("buttons.redo"), isWindows
                  ? [
                      getShortcutKey("CtrlOrCmd+Y"),
                      getShortcutKey("CtrlOrCmd+Shift+Z"),
                    ]
                  : [getShortcutKey("CtrlOrCmd+Shift+Z")])}
            {@render shortcut(t("labels.group"), [getShortcutKey("CtrlOrCmd+G")])}
            {@render shortcut(t("labels.ungroup"), [getShortcutKey("CtrlOrCmd+Shift+G")])}
            {@render shortcut(t("labels.toggleWrap"), [getShortcutKey("W")])}
            {@render shortcut(t("labels.flipHorizontal"), [getShortcutKey("Shift+H")])}
            {@render shortcut(t("labels.flipVertical"), [getShortcutKey("Shift+V")])}
            {@render shortcut(t("labels.showStroke"), [getShortcutKey("S")])}
            {@render shortcut(t("labels.showBackground"), [getShortcutKey("G")])}
            {@render shortcut(t("labels.showFonts"), [getShortcutKey("Shift+F")])}
            {@render shortcut(t("labels.decreaseFontSize"), [getShortcutKey("CtrlOrCmd+Shift+<")])}
            {@render shortcut(t("labels.increaseFontSize"), [getShortcutKey("CtrlOrCmd+Shift+>")])}
          </div>
</div>
        </div>
</Dialog>
