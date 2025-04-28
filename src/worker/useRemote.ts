import { ABORT_WORKER_REASON, spawnWorker } from "./spawnWorker";
import type { RemoteWorker } from "./spawnWorker";
import { useEffect, useState } from "react";
import { releaseProxy, Remote } from "comlink";

// abort controller example https://www.j-labs.pl/en/tech-blog/how-to-use-the-useeffect-hook-with-the-abortcontroller/

const nullWorker = { remote: null, worker: null };

export function useRemote<T>(
  scriptUrl?: string | null,
  options?: WorkerOptions
): null | Remote<T> {
  // for whatever reason, Remote and Worker must be stored together
  // in a RemoteWorker object to avoid a crash,
  // even though it is fine to destructure later
  // this is likely a bug in the proxy object from comlink
  // https://github.com/GoogleChromeLabs/comlink/issues/579#issuecomment-1060078803
  const [worker, setWorker] = useState<RemoteWorker<T> | typeof nullWorker>(
    nullWorker
  );
  useEffect(
    () => {
      // always set to nullWorker when the worker is regenerating
      setWorker(nullWorker);
      // if scriptUrl, spawn worker
      if (scriptUrl) {
        const abortController = new AbortController();
        let cancelled = false;
        let remoteWorker: RemoteWorker<T>;
        // reusable cleanup function
        function cleanup(remoteWorker: RemoteWorker<T>) {
          remoteWorker.remote[releaseProxy]();
          remoteWorker.worker.terminate();
        }
        spawnWorker<T>({
          scriptUrl,
          // split worker options to primitives to avoid rerendering when options are the same,
          // but the outer object may have changed
          options: {
            credentials: options?.credentials,
            name: options?.name,
            type: options?.type,
          },
          abortController,
        })
          .then((spawnedWorker) => {
            if (!cancelled) {
              remoteWorker = spawnedWorker;
              setWorker(spawnedWorker);
            } else {
              cleanup(spawnedWorker);
            }
          })
          .catch((reason) => {
            if (reason !== ABORT_WORKER_REASON) {
              throw new Error(reason);
            }
          });
        return () => {
          cancelled = true;
          if (remoteWorker) {
            cleanup(remoteWorker);
          } else {
            abortController.abort(ABORT_WORKER_REASON);
          }
        };
      }
    },
    // split worker options to primitives to avoid rerendering when options are the same,
    // but the outer object may have changed
    [scriptUrl, options?.credentials, options?.name, options?.type]
  );
  return worker.remote;
}
