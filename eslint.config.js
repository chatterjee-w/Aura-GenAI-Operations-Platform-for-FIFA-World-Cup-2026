import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        drawBaseGrid: "readonly",
        throttle: "readonly",
        debounce: "readonly"
      }
    },
    rules: {
      // Basic rules for vanilla JS
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-undef": "warn",
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"]
    }
  },
  pluginJs.configs.recommended,
];
