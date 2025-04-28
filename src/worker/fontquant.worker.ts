import { loadPyodide } from "pyodide";
import fontquantScript from "../python/fontquant.py?raw";
import { READY_MESSAGE } from "./spawnWorker";
import { expose } from "comlink";

export const pyodide = await loadPyodide({
  // offline https://github.com/pyodide/pyodide/discussions/4295#discussioncomment-7577274
  indexURL: "/static/lib/pyodide",
});

const customWheels = [
  "beziers-0.6.0-py3-none-any.whl",
  "booleanOperations-0.9.0-py3-none-any.whl",
  "defcon-0.12.1-py3-none-any.whl",
  "fontparts-0.12.4-py3-none-any.whl",
  "fontquant-0.0.1-py3-none-any.whl",
  "fs-2.4.16-py2.py3-none-any.whl",
  "kurbopy-0.11.1-cp37-abi3-pyodide_2024_0_wasm32.whl",
  "seaborn-0.13.2-py3-none-any.whl",
  "uharfbuzz-0.49.1.dev0+ga240603.d20250425-cp312-cp312-pyodide_2024_0_wasm32.whl",
  "vharfbuzz-0.3.1-py3-none-any.whl",
];

const packages = [
  "fonttools",
  "lxml",
  "matplotlib",
  "numpy",
  "pandas",
  "pyclipper",
  "setuptools",
  ...customWheels.map((customWheel) => `/static/lib/pyodide/${customWheel}`),
];
await pyodide.loadPackage(packages, {
  messageCallback(message) {
    if (!(message.startsWith("Loading") || message.startsWith("Loaded"))) {
      console.log(message);
    }
  },
  // disable integrity for simple hosting
  checkIntegrity: false,
});

// see also fontquant.py for file paths
pyodide.FS.mkdirTree("/home/pyodide/fontquant/fonts");

async function quantify(font: Uint8Array): Promise<string> {
  pyodide.FS.writeFile("/home/pyodide/fontquant/fonts/font.ttf", font);

  const dict = pyodide.globals.get("dict");
  const globals = dict();

  const result = await pyodide.runPythonAsync(fontquantScript, {
    globals,
    locals: globals,
  });

  globals.destroy();
  dict.destroy();

  pyodide.FS.unlink("/home/pyodide/fontquant/fonts/font.ttf");

  return result;
}

export const FontquantInterface = {
  quantify,
};

export type FontquantInterface = typeof FontquantInterface;

expose(FontquantInterface);

postMessage(READY_MESSAGE);
