// @ts-check
import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      import: importPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables: camelCase, UPPER_CASE, snake_case, PascalCase (components)
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'snake_case', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        // Parameters: camelCase with leading underscore allowed
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        // Functions: camelCase or PascalCase (components)
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // Types: PascalCase
        { selector: 'typeLike', format: ['PascalCase'] },
        // Imports: camelCase or PascalCase
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
          filter: { regex: '[\\s/\\-@]', match: true },
        },
        {
          selector: 'property',
          format: null,
          filter: { regex: '^@$', match: true },
        },
        {
          selector: 'property',
          modifiers: ['requiresQuotes'],
          format: null,
        },
      ],
      // Explicit return types (enforced in .ts files)
      '@typescript-eslint/explicit-function-return-type': 'off',
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
      'import/no-unresolved': 'error',
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
    },
  },
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'public/**',
      'src/routeTree.gen.ts',
      'src/shared/api/generated/**',
    ],
  }
)
