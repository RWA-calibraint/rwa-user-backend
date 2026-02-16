import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
export default [
  { ...js.configs.recommended, files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
];
