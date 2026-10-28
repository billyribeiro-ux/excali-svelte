## How to contribute

- to request a new translation, [open an issue](https://github.com/billyribeiro-ux/excali-svelte/issues/new).
- to update an existing translation, edit the JSON file for that language and open a pull request. Only change the values, never the keys.

## Completion of translation

[percentages.json](./percentages.json) holds a percentage of completion for each language. We generate these automatically [on build time](./../../.github/workflows/locales-coverage.yml) when a new translation PR appears.

We only make a language available on the app if it exceeds a certain threshold of completion.
