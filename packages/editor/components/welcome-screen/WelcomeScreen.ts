import { Center } from "./WelcomeScreen.Center";
import { HelpHint, MenuHint, ToolbarHint } from "./WelcomeScreen.Hints";
import WelcomeScreenComponent from "./WelcomeScreen.svelte";

/**
 * `<WelcomeScreen>` with `.Center` and `.Hints` (`MenuHint`, `ToolbarHint`,
 * `HelpHint`) parts. Children declared by the host are teleported into the
 * editor's welcome screen locations through tunnels.
 */
const WelcomeScreen = Object.assign(WelcomeScreenComponent, {
  Center,
  Hints: { MenuHint, ToolbarHint, HelpHint },
});

export default WelcomeScreen;
