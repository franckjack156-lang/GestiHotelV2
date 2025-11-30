import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'backups', '*.bak', '*.backup', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Relaxer les règles pour les any explicites (à nettoyer progressivement)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Variables préfixées par _ sont autorisées à ne pas être utilisées
      // Aussi ignorer les variables nommées 'error', 'err' dans les catch blocks
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '.*'
      }],
      // Autoriser les try/catch simples (utiles pour les cas asynchrones)
      'no-useless-catch': 'warn',
      // Autoriser @ts-ignore (à convertir progressivement en @ts-expect-error)
      '@typescript-eslint/ban-ts-comment': 'warn',
      // Autoriser les déclarations dans les case blocks
      'no-case-declarations': 'warn',
      // Autoriser l'export de constantes avec les composants (pratique courante)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Configuration spécifique pour les fichiers de test
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', 'src/tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
