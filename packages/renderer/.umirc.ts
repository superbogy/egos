import { defineConfig } from "umi";

export default defineConfig({
  npmClient: "pnpm",
  dva: {},
  plugins: ["@umijs/plugins/dist/dva"],
});
