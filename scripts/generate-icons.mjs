// Renders the favicon / PWA icon set from branding/*.svg.
//   node scripts/generate-icons.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "svelte-draw-app", "static");
fs.mkdirSync(out, { recursive: true });

const render = (svgFile, size, fileName) => {
  const svg = fs.readFileSync(path.join(root, "branding", svgFile));
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } })
    .render()
    .asPng();
  fs.writeFileSync(path.join(out, fileName), png);
  console.log(`${fileName} (${size}x${size})`);
};

for (const [size, name] of [
  [16, "favicon-16x16.png"],
  [32, "favicon-32x32.png"],
  [180, "apple-touch-icon.png"],
  [192, "android-chrome-192x192.png"],
  [512, "android-chrome-512x512.png"],
]) {
  render("logo.svg", size, name);
}
render("logo-maskable.svg", 192, "maskable_icon_x192.png");
render("logo-maskable.svg", 512, "maskable_icon_x512.png");

fs.copyFileSync(
  path.join(root, "branding", "logo.svg"),
  path.join(out, "favicon.svg"),
);
console.log("favicon.svg");
