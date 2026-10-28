<script lang="ts">
  import { getShortcutKey } from "../../shortcut";
</script>

<div class="ttd-dialog-submit-shortcut">
  <div class="ttd-dialog-submit-shortcut__key">
    {getShortcutKey("CtrlOrCmd")}
  </div>
  <div class="ttd-dialog-submit-shortcut__key">
    {getShortcutKey("Enter")}
  </div>
</div>
