<script lang="ts">
  import { REPOSITORY_URL } from "@svelte-draw/common";

  import DropdownMenuItemLink from "../../dropdownMenu/DropdownMenuItemLink.svelte";
  import { GithubIcon } from "../../icons";
</script>

<DropdownMenuItemLink
  icon={GithubIcon}
  href={REPOSITORY_URL}
  aria-label="GitHub"
>
  GitHub
</DropdownMenuItemLink>
