<script lang="ts">
  let { username }: { username: string | undefined } = $props();
</script>

Following
<span
  style:display="block"
  style:white-space="nowrap"
  style:overflow="hidden"
  style:text-overflow="ellipsis"
  style:max-width="100px"
  title={username}
>
  {username}
</span>
