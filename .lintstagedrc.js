/**
 * lint-staged configuration
 * Runs linters on git staged files only (fast and efficient)
 */

module.exports = {
  // TypeScript and TypeScript React files
  '**/*.{ts,tsx}': [
    // Format check (Prettier) - Fast check
    'prettier --check',
  ],

  // JavaScript files
  '**/*.{js,jsx}': ['prettier --check'],

  // JSON files
  '**/*.json': ['prettier --check'],

  // Markdown files
  '**/*.md': ['prettier --check'],

  // YAML files
  '**/*.{yml,yaml}': ['prettier --check'],
};

// Note: TypeScript type checking is done separately in pre-commit hook
// to check all files at once (more efficient than per-file checking)
