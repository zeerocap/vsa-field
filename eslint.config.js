// ESLint flat config (v9) — VSA HRMS
// Same shape as vsa-crm/eslint.config.js. Enforces correctness (no undef vars,
// hooks rules, unused imports) not style — Prettier handles formatting. Legacy
// files may accumulate warnings; lint-staged runs on changed files only via
// the pre-commit hook, so past debt doesn't block new commits.

import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**", "public/models/**", "api/**"] },
  js.configs.recommended,
  // Service worker — different globals (clients, self, skipWaiting, etc.)
  {
    files: ["src/sw.js", "public/sw.js"],
    languageOptions: {
      globals: { ...globals.serviceworker, ...globals.browser },
      sourceType: "script",
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node },
    },
    settings: { react: { version: "18.3" } },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-const-assign": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-unreachable": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],

      "no-prototype-builtins": "off",
      "no-case-declarations": "off",
    },
  },
  prettier,
];
