import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "src",
  publicDir: "../public",

  build: {
    outDir: "../dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        popup: resolve(
          process.cwd(),
          "src/popup/index.html"
        ),

        options: resolve(
          process.cwd(),
          "src/options/index.html"
        ),

        "content/content": resolve(
          process.cwd(),
          "src/content/content.ts"
        ),

        "background/background": resolve(
          process.cwd(),
          "src/background/background.ts"
        ),
      },

      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});