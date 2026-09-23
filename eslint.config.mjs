import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/prisma/contract.d.ts",
    "migrations/**",
    "scripts/**",
    "graphify-out/**",
    ".agents/**",
    ".claude/**",
    ".cursor/**",
    ".devin/**",
    ".opencode/**",
    ".github/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
