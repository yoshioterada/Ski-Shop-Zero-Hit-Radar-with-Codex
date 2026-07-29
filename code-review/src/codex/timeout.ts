export interface TimeoutController {
  signal: AbortSignal;
  didTimeout: () => boolean;
  dispose: () => void;
}

export function createTimeoutController(timeoutMs: number): TimeoutController {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error(`Timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose: () => clearTimeout(timer)
  };
}
