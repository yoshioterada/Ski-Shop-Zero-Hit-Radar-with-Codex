export type SettledTaskResult<T> =
  | { index: number; status: "fulfilled"; value: T }
  | { index: number; status: "rejected"; reason: unknown };

export async function runWithConcurrency<TInput, TOutput>(
  items: readonly TInput[],
  concurrency: number,
  worker: (item: TInput, index: number) => Promise<TOutput>
): Promise<SettledTaskResult<TOutput>[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("concurrency must be an integer greater than or equal to 1");
  }

  const results: SettledTaskResult<TOutput>[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        results[index] = {
          index,
          status: "fulfilled",
          value: await worker(items[index] as TInput, index)
        };
      } catch (error) {
        results[index] = {
          index,
          status: "rejected",
          reason: error
        };
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.allSettled(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}
