/**
 * lint-staged configuration
 * Automatically formats git staged files before commit
 */

module.exports = {
  // TypeScript and TypeScript React files
  '**/*.{ts,tsx}': [
    // Auto-format files (Prettier) - formats and stages changes
    'prettier --write',
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

// Note: TypeScript type checking is done separately in pre-commit hook
// to check all files at once (more efficient than per-file checking)
