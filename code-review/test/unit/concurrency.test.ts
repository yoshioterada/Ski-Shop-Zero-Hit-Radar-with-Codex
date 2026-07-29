import { describe, expect, it } from "vitest";

import { runWithConcurrency } from "../../src/codex/concurrency.js";

describe("runWithConcurrency", () => {
  it("runs sequentially when concurrency is 1", async () => {
    const started: number[] = [];
    const completed: number[] = [];

    const results = await runWithConcurrency([1, 2, 3], 1, async (item) => {
      started.push(item);
      await delay(5);
      completed.push(item);
      return item * 10;
    });

    expect(started).toEqual([1, 2, 3]);
    expect(completed).toEqual([1, 2, 3]);
    expect(results.map((result) => result.status)).toEqual(["fulfilled", "fulfilled", "fulfilled"]);
  });

  it("caps active workers at the requested concurrency", async () => {
    let active = 0;
    let maxActive = 0;

    await runWithConcurrency(Array.from({ length: 14 }, (_, index) => index), 7, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await delay(10);
      active -= 1;
    });

    expect(maxActive).toBeLessThanOrEqual(7);
    expect(maxActive).toBe(7);
  });

  it("continues after an item fails", async () => {
    const results = await runWithConcurrency([1, 2, 3], 2, async (item) => {
      if (item === 2) {
        throw new Error("forced failure");
      }
      return item;
    });

    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
  });
});

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
