import js from "@eslint/js";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "dist",
      "frontend/dist",
      "worker/dist",
      "coverage",
      ".wrangler",
      ".husky",
      "scripts/deploy-pages.mjs",
      "worker/.wrangler",
      "e2e/playwright-report",
      "e2e/test-results"
    ]
  },
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.es2024
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "no-console": [
        "warn",
        {
          allow: ["warn", "error", "info", "debug", "log"]
        }
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["frontend/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.browser
      }
    },
    extends: [
      reactPlugin.configs.flat.recommended,
      reactHooksPlugin.configs.flat.recommended,
      jsxA11yPlugin.flatConfigs.recommended
    ],
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off"
    }
  },
  {
    files: ["worker/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.worker
      }
    }
  },
  {
    files: ["worker/src/lib/logger.ts", "frontend/src/lib/logger.ts"],
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.node
      }
    }
  }
);
