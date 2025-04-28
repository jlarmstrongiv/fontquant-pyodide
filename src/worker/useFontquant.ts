import fontquantUrl from "./fontquant.worker?worker&url";
import { useRemote } from "./useRemote";
import { FontquantInterface } from "./fontquant.worker";
import { Remote } from "comlink";

const workerOptions: WorkerOptions = {
  name: "fontquant",
  type: "module",
};

export function useFontquant(): Remote<FontquantInterface> | null {
  return useRemote<FontquantInterface>(fontquantUrl, workerOptions);
}
