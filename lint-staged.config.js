export default {
  "*.{js,ts,svelte}": ["eslint --max-warnings=0 --fix", "prettier --write"],
  "*.{css,scss,json,md,html,yml}": ["prettier --write"],
};
