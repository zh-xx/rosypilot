import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import obsidian from 'eslint-plugin-obsidianmd';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...obsidian.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      'no-unused-vars': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    ignores: [
      'main.js',
      'node_modules/**',
      '*.config.*',
      'src/scripts/**',
      '**/*.test.ts',
    ],
  },
);
