import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Downgrade these from errors to warnings for build compatibility
      // They should still be fixed over time but shouldn't block builds
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-empty-object-type": "warn",
      "react-hooks/exhaustive-deps": "warn",
      // Allow triple-slash references (used by Next.js generated files)
      "@typescript-eslint/triple-slash-reference": "off",
      // Allow require() in config files (Tailwind, Jest, etc.)
      "@typescript-eslint/no-require-imports": "warn",
      // Allow unescaped entities in JSX (apostrophes, quotes) - stylistic
      "react/no-unescaped-entities": "off",
      
      // Keep these as errors (security/correctness)
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "__tests__/**",
      // Ignore generated Next.js files
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
