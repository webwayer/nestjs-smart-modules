import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['build/**', 'coverage/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // Type-aware linting for all TypeScript sources.
  {
    files: ['src/**/*.ts', 'spec/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Type-only imports must be marked as such: together with
      // verbatimModuleSyntax in the ESM build this guarantees the compiled
      // output never gains a runtime dependency on @nestjs/common.
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },

  // Config files at the repo root are plain ESM without type information.
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Tests intentionally juggle any/unsafe values and non-null assertions.
  {
    files: ['spec/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/unbound-method': 'off',
      // Test factories are deliberately async without await (they exercise the
      // Promise code path), and negative tests throw fresh assertion errors.
      '@typescript-eslint/require-await': 'off',
      'preserve-caught-error': 'off',
      'no-console': 'off',
    },
  },

  // Must stay last to disable rules that conflict with Prettier.
  prettierConfig,
)
