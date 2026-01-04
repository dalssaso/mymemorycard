// @ts-check
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables: camelCase, UPPER_CASE, snake_case, PascalCase (for destructured class imports)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'snake_case', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Parameters: camelCase with leading underscore allowed
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        // Functions: camelCase
        { selector: 'function', format: ['camelCase'] },
        // Types: PascalCase
        { selector: 'typeLike', format: ['PascalCase'] },
        // Class like: camelCase or PascalCase (for Pool import etc)
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        // Properties: allow camelCase, snake_case, or any with hyphens/slashes (API identifiers)
        {
          selector: 'property',
          format: ['camelCase', 'snake_case', 'PascalCase'],
          filter: { regex: '[-/]', match: false },
        },
        // Allow any format for properties containing hyphens or slashes (HTTP headers, model IDs)
        {
          selector: 'property',
          format: null,
          filter: { regex: '[-/]', match: true },
        },
      ],
      // Explicit return types
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      // Strict any detection
      '@typescript-eslint/no-explicit-any': 'error',
      // Type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/member-ordering': 'error',
      // Import rules
      'import/no-unresolved': ['error', { ignore: ['^bun:'] }],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
  {
    ignores: ['dist/**', 'drizzle/**', 'coverage/**', 'node_modules/**'],
  }
)
