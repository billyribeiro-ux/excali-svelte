<script lang="ts">
  import Icon from "@svelte-draw/editor/components/Icon.svelte";
  import {
    ArrowheadArrowIcon,
    CloseIcon,
    TrashIcon,
  } from "@svelte-draw/editor/components/icons";

  let { onChange }: { onChange: () => void } = $props();

  const moveForward = () => {
    if (
      !window.visualDebug?.currentFrame ||
      isNaN(window.visualDebug?.currentFrame ?? -1)
    ) {
      window.visualDebug!.currentFrame = 0;
    }
    window.visualDebug!.currentFrame += 1;
    onChange();
  };
  const moveBackward = () => {
    if (
      !window.visualDebug?.currentFrame ||
      isNaN(window.visualDebug?.currentFrame ?? -1) ||
      window.visualDebug?.currentFrame < 1
    ) {
      window.visualDebug!.currentFrame = 1;
    }
    window.visualDebug!.currentFrame -= 1;
    onChange();
  };
  const reset = () => {
    window.visualDebug!.currentFrame = undefined;
    onChange();
  };
  const trashFrames = () => {
    if (window.visualDebug) {
      window.visualDebug.currentFrame = undefined;
      window.visualDebug.data = [];
    }
    onChange();
  };
</script>

<button
  class="ToolIcon_type_button"
  data-testid="debug-forward"
  aria-label="Move forward"
  type="button"
  onclick={trashFrames}
>
  <div class="ToolIcon__icon" aria-hidden="true" aria-disabled="false">
    <Icon icon={TrashIcon} />
  </div>
</button>
<button
  class="ToolIcon_type_button"
  data-testid="debug-forward"
  aria-label="Move forward"
  type="button"
  onclick={moveBackward}
>
  <div class="ToolIcon__icon" aria-hidden="true" aria-disabled="false">
    <Icon icon={ArrowheadArrowIcon({ flip: true })} />
  </div>
</button>
<button
  class="ToolIcon_type_button"
  data-testid="debug-forward"
  aria-label="Move forward"
  type="button"
  onclick={reset}
>
  <div class="ToolIcon__icon" aria-hidden="true" aria-disabled="false">
    <Icon icon={CloseIcon} />
  </div>
</button>
<button
  class="ToolIcon_type_button"
  data-testid="debug-backward"
  aria-label="Move backward"
  type="button"
  onclick={moveForward}
>
  <div class="ToolIcon__icon" aria-hidden="true" aria-disabled="false">
    <Icon icon={ArrowheadArrowIcon({})} />
  </div>
</button>
