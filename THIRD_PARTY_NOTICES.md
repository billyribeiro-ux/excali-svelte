# Third-party notices

Evidence is limited to what exists in this repository. Entries marked **UNVERIFIED** have no license text
in the repo; obtain the license from the upstream font project before redistributing. npm dependency licenses are not
reproduced here: they are recorded per package in `pnpm-lock.yaml` and in each package's own `LICENSE` under `node_modules`.

## Fonts (`packages/editor/fonts/`)

| Font | Files | License evidence in repo |
| --- | --- | --- |
| Excalifont | `fonts/Excalifont/*.woff2` | SIL Open Font License 1.1, full text and metadata in the header of `fonts/Excalifont/index.ts`. `copyright: Copyright (c) 2024 by Excalidraw. All rights reserved.`; `trademark: Excalifont is a trademark of Excalidraw.`; designer metadata names Your Own Font Foundry (Virgil) and Jan Filipek / DizajnDesign (Excalifont, modifications). |
| Xiaolai (LXGW "Xiaolai SC" v3.11) | `fonts/Xiaolai/*.woff2` | SIL OFL 1.1 per the metadata in `fonts/Xiaolai/index.ts` (`license`, `licenseURL: http://scripts.sil.org/OFL`); `copyright: Copyright (c) 2020 LXGW`. The header records modifications: non-CJK codepoints removed, Hangul side-bearings reduced to 40%, some CJK codepoints re-centred, and the font split into unicode-range subsets. The full OFL text is **not** embedded there (only the license sentence and URL). Whether the original declares a Reserved Font Name is **UNVERIFIED**. |
| Comic Shanns | `fonts/ComicShanns/*.woff2`, `ComicShanns-Regular.sfd` | MIT License, text in `fonts/ComicShanns/index.ts`. Copyright (c) 2018 Shannon Miwa, (c) 2023 Jesus Gonzalez, (c) 2023 Rodrigo Batista de Moraes, (c) 2024 Fini Jastrow, (c) 2024 Kyle Beechly. |
| Assistant | `fonts/Assistant/*.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |
| Cascadia Code | `fonts/Cascadia/CascadiaCode-Regular.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |
| Virgil | `fonts/Virgil/Virgil-Regular.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |
| Lilita One | `fonts/Lilita/*.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |
| Nunito | `fonts/Nunito/*.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |
| Liberation Sans (Helvetica fallback) | `fonts/Liberation/LiberationSans-Regular.woff2` | license text not present in this repository - **UNVERIFIED**; obtain from the upstream font project before redistribution |

`fonts/Helvetica` and `fonts/Emoji` do not bundle files: they use the local-font protocol (`LOCAL_FONT_PROTOCOL`) and resolve to fonts
installed on the user's system.

### Excalifont and the OFL Reserved Font Name rules

Excalifont is shipped **unmodified under its original name**, which the OFL permits (conditions 2 and 5 of the license text in
`fonts/Excalifont/index.ts`). Under OFL condition 3, a *modified* version must not use a Reserved Font Name without the
copyright holder's written permission, so if any OFL font here is ever modified it must be renamed. The OFL text also forbids
using the author's or copyright holder's name to promote a modified version, and requires that copies keep the copyright notice and
license (kept in the metadata header files named above). svelte-draw makes no claim to the "Excalifont" trademark; see [NOTICE.md](NOTICE.md).

## Bundled WebAssembly modules (`packages/editor/subset/`)

Generated base64 modules; the license information below is quoted from the header comment of each file.

| Module | File | Source package and license |
| --- | --- | --- |
| HarfBuzz subsetting | `subset/harfbuzz/harfbuzz-wasm.ts` | package `harfbuzzjs` 0.3.6 (author Ebrahim Byagowi), MIT; header: "Apache license for Zephyr libc implementations (zephyr-string.c), emmalloc.cpp (from emscripten project) and MIT for rest of the project"; Copyright (c) 2019 Ebrahim Byagowi. The header contains the full MIT text. The Apache-2.0 text is **not** present in the repo. |
| WOFF2 | `subset/woff2/woff2-wasm.ts` | package `fonteditor-core` 2.4.0 (authors kekee000, junmer), MIT; Copyright (c) 2014 ecomfe. The header contains the full MIT text. |

## Source code derived from Excalidraw

MIT, Copyright (c) 2020 Excalidraw: see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
