import { createLogger, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import { viteStaticCopy } from "vite-plugin-static-copy";

// custom logger https://github.com/vitejs/vite/issues/9597#issuecomment-1209305107
const customLogger = createLogger();
const originalWarning = customLogger.warn;
customLogger.warn = (message, options) => {
  if (
    (message.includes("[plugin vite:resolve]") ||
      message.includes("Use of eval") ||
      message.includes("is not exported by")) &&
    message.includes("pyodide")
  ) {
    return;
  }
  originalWarning(message, options);
};

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/node_modules",
];

// "modules" target is good, but does not support top-level await https://vitejs.dev/config/build-options#build-target
// support
// - https://caniuse.com/?search=top%20level%20await
// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await
// - https://en.wikipedia.org/wiki/ECMAScript_version_history#13th_Edition_%E2%80%93_ECMAScript_2022
const target = ["es2022", "edge89", "firefox89", "chrome89", "safari15"];

// https://vite.dev/config/
export default defineConfig({
  build: {
    // build target https://vite.dev/config/build-options#build-target
    target,
  },
  customLogger,
  // esbuild target https://vite.dev/guide/features#target
  esbuild: {
    target,
  },
  optimizeDeps: {
    exclude: ["pyodide"],
    esbuildOptions: {
      // optimizeDeps target https://github.com/kleisauke/wasm-vips/issues/58#issuecomment-1817825242
      target,
    },
  },
  worker: {
    plugins: () => [wasm()],
    format: "es",
  },
  plugins: [
    tailwindcss(),
    react(),
    wasm(),
    viteStaticCopy({
      targets: [
        {
          src: ["node_modules/pyodide/*", ...PYODIDE_EXCLUDE],
          dest: "static/lib/pyodide/",
        },
      ],
    }),
  ],
});
