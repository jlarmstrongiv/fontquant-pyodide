import { wrap } from "comlink";
import type { Remote } from "comlink";

// spawn worker example https://github.com/GoogleChromeLabs/comlink/issues/635#issuecomment-1598913044
// abort controller example https://stackoverflow.com/a/65805464

export type RemoteWorker<T> = { remote: Remote<T>; worker: Worker };

export const READY_MESSAGE = { __READY__: true };
export const ABORT_WORKER_REASON = "__ABORT_WORKER_REASON__";

export type SpawnParameters = {
  scriptUrl: string;
  options?: WorkerOptions;
  abortController: AbortController;
};
export async function spawnWorker<T>({
  abortController,
  options = {},
  scriptUrl,
}: SpawnParameters): Promise<RemoteWorker<T>> {
  options.type ??= "module";
  const worker = new Worker(scriptUrl, options);

  await new Promise<void>((resolve, reject) => {
    function readyListener(event: MessageEvent<typeof READY_MESSAGE>) {
      if (event.data.__READY__ === true) {
        worker.removeEventListener("message", readyListener);
        resolve();
      }
    }

    worker.addEventListener("message", readyListener, {
      signal: abortController.signal,
    });

    function abortListener({ target }: Event): void {
      abortController.signal.removeEventListener("abort", abortListener);
      worker.terminate();
      reject(getReason(target));
    }
    abortController.signal.addEventListener("abort", abortListener);
  });

  const remote = wrap<T>(worker);

  return { worker, remote };
}

// reason does not exist in typescript for EventTarget https://stackoverflow.com/questions/71211861/property-reason-does-not-exist-on-type-eventtarget-ts2339
function getReason(target: EventTarget | null): string | undefined {
  if (
    target !== null &&
    "reason" in target &&
    typeof target.reason === "string"
  ) {
    return target.reason;
  }
}
