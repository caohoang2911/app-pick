/**
 * lint-staged configuration
 * Automatically formats git staged files before commit
 */

module.exports = {
  // TypeScript and TypeScript React files
  '**/*.{ts,tsx}': [
    // Auto-format files (Prettier) - formats and stages changes
    'prettier --write',
    // Full-project check once per commit batch (stale closure / cross-file errors)
    () => 'yarn type-check',
  ],

  // JavaScript files
  '**/*.{js,jsx}': ['prettier --write'],

  // JSON files
  '**/*.json': ['prettier --write'],

  // Markdown files
  '**/*.md': ['prettier --write'],

  // YAML files
  '**/*.{yml,yaml}': ['prettier --write'],
};

// Note: yarn type-check runs when any staged .ts/.tsx matches (after Prettier).
// Commits that touch only non-TS files skip type-check; run `yarn type-check` locally or rely on CI.
