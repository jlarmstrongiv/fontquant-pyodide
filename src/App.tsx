import demoJson from "./demo/Inter[opsz,wght].ttf.json?raw";
import { useFontquant } from "./worker/useFontquant";
import { useCallback, useState } from "react";
import { transfer } from "comlink";
import { twMerge } from "tailwind-merge";

export function App() {
  const [result, setResult] = useState<string | null>(null);
  const fontquant = useFontquant();
  const [isProcessing, setIsProcessing] = useState(false);
  const setDemo = useCallback(() => setResult(demoJson), []);
  const onFiles = useCallback(
    // file input event https://stackoverflow.com/a/76108735
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setIsProcessing(true);
        setResult(null);
        const uint8Array = new Uint8Array(await file.arrayBuffer());
        // fontquant should always exist, as the input is disabled without it
        if (fontquant) {
          const result = await fontquant.quantify(
            transfer(uint8Array, [uint8Array.buffer])
          );
          const prettifiedResult = JSON.stringify(JSON.parse(result), null, 2);
          setIsProcessing(false);
          setResult(prettifiedResult);
        }
      }
    },
    [fontquant]
  );

  const isLoading = !fontquant || isProcessing;

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-system text-6xl text-center font-medium pt-20">
          Fontquant
        </h1>
        <div className="prose py-8">
          <p>
            Fontquant looks into a font and quantifies what’s in it, creating a
            machine-readable representation of font features{" "}
            <strong>
              that it has <em>proven</em> to work
            </strong>
            . It makes heavy use of the Harfbuzz shaping engine to prove the
            functionality of font features, rather than just looking up the
            feature list in the font.
          </p>
          <p>The purpose of Fontquant is to:</p>
          <ul>
            <li>
              provide a high-level quantifiable overview of features and
              technical quality in order to make fonts{" "}
              <strong>comparable</strong>
            </li>
            <li>
              to make their features <strong>searchable</strong> through a user
              interface as part of a font library
            </li>
            <li>
              and for font <strong>quality assurance</strong> (QA).
            </li>
          </ul>
          <p>
            The selected font is processed locally on your machine—no file
            upload or server involved.
          </p>
        </div>
      </div>
      <div className="flex flex-row gap-4 place-content-center">
        {/* styling file elements https://stackoverflow.com/a/25825731 */}
        <label>
          <span
            className={twMerge(
              "block rounded-md cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-offset-2",
              isLoading
                ? "bg-gray-600 hover:bg-gray-600 focus-visible:outline-gray-600"
                : "bg-gray-900 hover:bg-gray-950 focus-visible:outline-gray-900"
            )}
          >
            {isLoading ? "Loading…" : "Select font"}
          </span>
          <input
            type="file"
            className="sr-only"
            accept=".ttf,.otf"
            onChange={onFiles}
            disabled={!fontquant}
          />
        </label>
        <button
          type="button"
          className="block rounded-md cursor-pointer bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={setDemo}
        >
          Try with Inter UI
        </button>
        <a
          href="https://github.com/googlefonts/fontquant"
          target="_blank"
          className="block rounded-md cursor-pointer bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          onClick={setDemo}
        >
          GitHub
        </a>
      </div>
      {isProcessing ? (
        <p className="max-w-2xl mx-auto pt-8 text-center prose">
          Processing a font may take up to five minutes…
        </p>
      ) : null}
      {result === null ? null : (
        <pre className="mx-auto w-fit pt-8 pb-[80vh] font-system-mono">
          {result}
        </pre>
      )}
    </div>
  );
}
