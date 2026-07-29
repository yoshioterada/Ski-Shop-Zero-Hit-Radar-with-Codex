import type { AgentReviewResult, ReviewJob } from "../agents/agent-types.js";

export interface AgentRunner {
  run(job: ReviewJob): Promise<AgentReviewResult>;
}
