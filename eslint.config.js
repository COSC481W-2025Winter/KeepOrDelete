import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
	{
		files: ["**/*.js"],
		plugins: {
			js,
		},
		extends: ["js/recommended"],
		rules: {
			"no-undef": "warn",
         "no-unused-vars": ["warn",{
            "argsIgnorePattern": "^_"
         }]
		},
      languageOptions: {
         globals: {
            ...globals.browser,
            ...globals.jquery,
            ...globals.node,
         },
      }
	},
]);

