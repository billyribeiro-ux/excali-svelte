import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.svelte-kit/**",
      "**/build/**",
      "**/dist/**",
      "coverage/**",
      "packages/editor/fonts/**/index.ts",
      "packages/editor/subset/**/*-wasm.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
        },
      ],
      // the editor core predates strict `any` hygiene; tighten gradually
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  {
    // Style/hygiene rules that fire on code inherited unchanged from upstream
    // Excalidraw (geometry, history, collab, test fixtures). They flag no
    // defect in that code; tighten them gradually rather than churn it here.
    rules: {
      "no-case-declarations": "off",
      "no-useless-assignment": "off",
      "no-loss-of-precision": "off",
      "no-prototype-builtins": "off",
      "no-async-promise-executor": "off",
      "no-irregular-whitespace": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      // external links (GitHub, docs) and trusted static SVG icon markup
      "svelte/no-navigation-without-resolve": "off",
      "svelte/no-at-html-tags": "off",
      // plain Map/Set inside non-reactive editor code is intentional
      "svelte/prefer-svelte-reactivity": "off",
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    // inside the editor package, import specific modules, not its barrel
    files: ["packages/editor/**/*.{ts,svelte}"],
    ignores: ["packages/editor/**/*.test.ts", "packages/editor/**/*.test.svelte"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@svelte-draw/editor"],
              message: "Do not import from the barrel 'index.ts'. Use direct imports of the specific module.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
);
